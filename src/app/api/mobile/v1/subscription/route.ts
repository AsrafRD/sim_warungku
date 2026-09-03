import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth || !auth.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { storeId } = auth;

    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        subscription: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Toko tidak ditemukan" },
        { status: 404 }
      );
    }

    const sub = store.subscription;
    const now = new Date();
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
          canSyncCloud = false; // Trial runs purely locally
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

    return NextResponse.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
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
        },
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/mobile/v1/subscription Error]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
