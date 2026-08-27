"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getActiveShift(storeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    const shift = await db.shift.findFirst({
      where: {
        storeId: storeDbId,
        cashierId: session.user.id,
        status: "OPEN",
      },
    });

    return { success: true, data: shift };
  } catch (error) {
    console.error("[getActiveShift]", error);
    return { success: false, message: "Internal server error" };
  }
}

import { validateStoreAccess } from "@/lib/auth";

export async function openShift(storeId: string, openingBalance: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return { success: false, message: "Akses ditolak" };
    }

    // Check if there's already an open shift
    const existing = await db.shift.findFirst({
      where: {
        storeId: storeDbId,
        cashierId: session.user.id,
        status: "OPEN",
      },
    });

    if (existing) {
      return { success: false, message: "Anda sudah memiliki shift yang aktif." };
    }

    const newShift = await db.shift.create({
      data: {
        storeId: storeDbId,
        cashierId: session.user.id,
        openingBalance,
        status: "OPEN",
      },
    });

    revalidatePath(`/${storeId}/pos`);
    return { success: true, data: newShift };
  } catch (error) {
    console.error("[openShift]", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function closeShift(shiftId: string, closingBalance: number, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const shift = await db.shift.findUnique({
      where: { id: shiftId },
      include: {
        orders: true,
      },
    });

    if (!shift || shift.cashierId !== session.user.id || shift.status === "CLOSED") {
      return { success: false, message: "Shift tidak ditemukan atau sudah ditutup." };
    }

    // Calculate expected balance: Opening + all CASH orders - (maybe Debt payments if we link them to shift)
    // For now, let's just sum CASH orders in this shift
    const cashOrdersTotal = shift.orders
      .filter((o) => o.paymentType === "CASH")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const expectedBalance = Number(shift.openingBalance) + cashOrdersTotal;

    const closedShift = await db.shift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        closingBalance,
        expectedBalance,
        notes,
        closedAt: new Date(),
      },
    });

    revalidatePath(`/${shift.storeId}/pos`);
    return { success: true, data: closedShift };
  } catch (error) {
    console.error("[closeShift]", error);
    return { success: false, message: "Internal server error" };
  }
}
