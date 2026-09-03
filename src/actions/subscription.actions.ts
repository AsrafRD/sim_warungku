"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import type { ActionResponse } from "@/lib/types/action-response";

export type PaidPlan =
  | "MOBILE_MONTHLY"
  | "MOBILE_YEARLY"
  | "COMBO_MONTHLY"
  | "COMBO_YEARLY";

export const PLAN_PRICES: Record<PaidPlan, number> = {
  MOBILE_MONTHLY: 49000,
  MOBILE_YEARLY: 490000,
  COMBO_MONTHLY: 99000,
  COMBO_YEARLY: 990000,
};

export const PLAN_NAMES: Record<PaidPlan, string> = {
  MOBILE_MONTHLY: "Paket Mobile Pro (1 Bulan)",
  MOBILE_YEARLY: "Paket Mobile Pro (1 Tahun)",
  COMBO_MONTHLY: "Paket Combo Pro Mobile + Web (1 Bulan)",
  COMBO_YEARLY: "Paket Combo Pro Mobile + Web (1 Tahun)",
};

function generateSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

const createTrialStoreSchema = z.object({
  name: z.string().min(3, "Nama toko minimal 3 karakter").max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * Buat Toko dengan Paket Free Trial 5 Hari (100% Lokal di Mobile)
 */
export async function activateStoreWithTrialAction(
  data: z.infer<typeof createTrialStoreSchema>
): Promise<ActionResponse<{ slug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Anda harus login terlebih dahulu" };
    }
    const userId = session.user.id;

    const parsed = createTrialStoreSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data toko tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, address, phone } = parsed.data;
    const slug = generateSlug(name);

    // Durasi Trial: 5 Hari Saja Sesuai Arahan Bisnis
    const now = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 5);

    const store = await db.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name,
          slug,
          address,
          phone,
          ownerId: userId,
        },
      });

      await tx.subscription.create({
        data: {
          storeId: newStore.id,
          plan: "TRIAL",
          status: "TRIAL",
          hasWebAccess: false, // Default trial khusus mobile POS
          trialEndsAt: trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
        },
      });

      return newStore;
    });

    return {
      success: true,
      message: "Toko berhasil dibuat dengan Trial 5 Hari",
      data: { slug: store.slug },
    };
  } catch (error) {
    console.error("[activateStoreWithTrialAction]", error);
    return { success: false, message: "Terjadi kesalahan pada sistem" };
  }
}

const createPaidStoreTokenSchema = z.object({
  storeName: z.string().min(3, "Nama toko minimal 3 karakter"),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  plan: z.enum([
    "MOBILE_MONTHLY",
    "MOBILE_YEARLY",
    "COMBO_MONTHLY",
    "COMBO_YEARLY",
  ]),
});

/**
 * Buat Snap Token Midtrans saat onboarding pembuatan toko baru berbayar
 */
export async function createPaidStoreTokenAction(
  data: z.infer<typeof createPaidStoreTokenSchema>
): Promise<ActionResponse<{ token: string; orderId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, message: "Anda harus login terlebih dahulu" };
    }

    const parsed = createPaidStoreTokenSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data paket tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { storeName, plan } = parsed.data;
    const price = PLAN_PRICES[plan];
    const orderId = `STORE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const snapResult = await createSnapTransaction({
      orderId,
      grossAmount: price,
      customerName: session.user.name || "Owner Toko",
      customerEmail: session.user.email,
      items: [
        {
          id: `PLAN-${plan}`,
          price,
          quantity: 1,
          name: `${PLAN_NAMES[plan]} - ${storeName.slice(0, 18)}`,
        },
      ],
    });

    return {
      success: true,
      message: "Token transaksi berhasil dibuat",
      data: {
        token: snapResult.token,
        orderId,
      },
    };
  } catch (error) {
    console.error("[createPaidStoreTokenAction]", error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || "Gagal membuat transaksi pembayaran",
    };
  }
}

/**
 * Aktivasi toko berbayar setelah popup Midtrans Snap sukses
 */
export async function completePaidStoreActivationAction(data: {
  orderId: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  plan: PaidPlan;
  paymentType?: string;
}): Promise<ActionResponse<{ slug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    const { orderId, storeName, storeAddress, storePhone, plan, paymentType } = data;
    const slug = generateSlug(storeName);

    // Hitung masa aktif
    const now = new Date();
    const periodEnd = new Date();
    if (plan.includes("MONTHLY")) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Paket Combo memberikan hak akses Web POS & Manajemen Produk
    const hasWebAccess = plan === "COMBO_MONTHLY" || plan === "COMBO_YEARLY";

    const store = await db.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name: storeName,
          slug,
          address: storeAddress,
          phone: storePhone,
          ownerId: userId,
        },
      });

      await tx.subscription.create({
        data: {
          storeId: newStore.id,
          plan: plan,
          status: "ACTIVE",
          hasWebAccess,
          amount: PLAN_PRICES[plan],
          midtransOrderId: orderId,
          midtransPaymentType: paymentType || "SNAP",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      return newStore;
    });

    return {
      success: true,
      message: "Toko dan lisensi aktif berhasil didaftarkan",
      data: { slug: store.slug },
    };
  } catch (error) {
    console.error("[completePaidStoreActivationAction]", error);
    return { success: false, message: "Gagal mengaktifkan toko" };
  }
}

/**
 * Buat Snap Token untuk perpanjangan / upgrade lisensi toko yang sudah berjalan
 */
export async function createStoreRenewalTokenAction(data: {
  storeId: string;
  plan: PaidPlan;
}): Promise<ActionResponse<{ token: string; orderId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, message: "Anda harus login terlebih dahulu" };
    }

    const store = await db.store.findFirst({
      where: { id: data.storeId, ownerId: session.user.id },
    });

    if (!store) {
      return { success: false, message: "Toko tidak ditemukan atau akses ditolak" };
    }

    const price = PLAN_PRICES[data.plan];
    const orderId = `RENEW-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const snapResult = await createSnapTransaction({
      orderId,
      grossAmount: price,
      customerName: session.user.name || "Owner Toko",
      customerEmail: session.user.email,
      items: [
        {
          id: `RENEW-${data.plan}`,
          price,
          quantity: 1,
          name: `Perpanjangan ${PLAN_NAMES[data.plan]} - ${store.name.slice(0, 18)}`,
        },
      ],
    });

    return {
      success: true,
      data: {
        token: snapResult.token,
        orderId,
      },
    };
  } catch (error) {
    console.error("[createStoreRenewalTokenAction]", error);
    return { success: false, message: "Gagal menyiapkan pembayaran perpanjangan" };
  }
}

/**
 * Selesaikan perpanjangan lisensi toko setelah Snap sukses
 */
export async function completeStoreRenewalAction(data: {
  storeId: string;
  orderId: string;
  plan: PaidPlan;
  paymentType?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const sub = await db.subscription.findUnique({
      where: { storeId: data.storeId },
    });

    if (!sub) {
      return { success: false, message: "Data langganan tidak ditemukan" };
    }

    const now = new Date();
    // Jika masih aktif, tambahkan dari currentPeriodEnd. Jika sudah expired, mulai dari now.
    const baseDate = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? new Date(sub.currentPeriodEnd) : now;
    const newPeriodEnd = new Date(baseDate);

    if (data.plan.includes("MONTHLY")) {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    const hasWebAccess = data.plan === "COMBO_MONTHLY" || data.plan === "COMBO_YEARLY";

    await db.subscription.update({
      where: { storeId: data.storeId },
      data: {
        plan: data.plan,
        status: "ACTIVE",
        hasWebAccess,
        amount: PLAN_PRICES[data.plan],
        midtransOrderId: data.orderId,
        midtransPaymentType: data.paymentType || "SNAP",
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
      },
    });

    return {
      success: true,
      message: "Perpanjangan lisensi toko berhasil diaktifkan",
    };
  } catch (error) {
    console.error("[completeStoreRenewalAction]", error);
    return { success: false, message: "Gagal memperbarui masa aktif toko" };
  }
}
