import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { signMobileToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Ambil toko milik user berserta status langganan
    const store = await db.store.findFirst({
      where: { ownerId: user.id },
      include: { subscription: true },
    });

    if (!store) {
      // User belum punya toko (Belum onboarding via web)
      const token = signMobileToken({
        userId: user.id,
        storeId: "",
      });

      return NextResponse.json({
        success: true,
        message: "Login berhasil, tapi belum memiliki toko. Silakan buat toko melalui website resmi.",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          store: null,
          subscription: null,
        },
      });
    }

    // Evaluasi status lisensi & masa aktif
    const now = new Date();
    const sub = store.subscription;
    let isExpired = false;
    let canSyncCloud = false;
    let licenseStatus: "TRIAL" | "ACTIVE" | "EXPIRED" = "TRIAL";

    if (sub) {
      if (sub.status === "ACTIVE") {
        if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
          isExpired = true;
          licenseStatus = "EXPIRED";
          canSyncCloud = false;
        } else {
          licenseStatus = "ACTIVE";
          canSyncCloud = true;
        }
      } else if (sub.status === "TRIAL") {
        if (sub.trialEndsAt && sub.trialEndsAt < now) {
          isExpired = true;
          licenseStatus = "EXPIRED";
          canSyncCloud = false;
        } else {
          licenseStatus = "TRIAL";
          // Sesuai aturan: data trial hanya berjalan di lokal, sinkronisasi cloud dikunci sampai upgrade berbayar
          canSyncCloud = false;
        }
      } else {
        isExpired = true;
        licenseStatus = "EXPIRED";
        canSyncCloud = false;
      }
    }

    const targetDate = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    let daysRemaining = 999;
    if (targetDate) {
      const diffTime = targetDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const isExpiringSoon = !isExpired && daysRemaining <= 2;

    const token = signMobileToken({
      userId: user.id,
      storeId: store.id,
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          address: store.address,
        },
        subscription: {
          plan: sub?.plan || "TRIAL",
          status: licenseStatus,
          isExpired,
          isExpiringSoon,
          daysRemaining: targetDate ? Math.max(0, daysRemaining) : null,
          canSyncCloud,
          hasWebAccess: sub?.hasWebAccess ?? false,
          trialEndsAt: sub?.trialEndsAt || null,
          currentPeriodEnd: sub?.currentPeriodEnd || null,
          notice: !canSyncCloud
            ? licenseStatus === "TRIAL"
              ? "Akun Trial: Operasional berjalan 100% lokal di HP Anda. Sinkronisasi cloud tersedia setelah aktivasi paket berbayar."
              : "Masa aktif langganan toko telah berakhir. Data Anda aman. Silakan perpanjang melalui website resmi."
            : isExpiringSoon
            ? `Peringatan: Masa aktif lisensi toko tersisa ${daysRemaining} hari lagi. Segera perpanjang melalui website resmi.`
            : "Lisensi aktif. Sinkronisasi cloud diizinkan.",
        },
      },
    });
  } catch (error: unknown) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
