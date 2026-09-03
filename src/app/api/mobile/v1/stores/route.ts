import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const stores = await db.store.findMany({
      where: { ownerId: auth.userId },
      include: { subscription: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error: unknown) {
    console.error("Mobile Stores GET API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Sesuai aturan bisnis: Pembuatan cabang/toko baru eksklusif melalui website resmi
  return NextResponse.json(
    {
      success: false,
      code: "CREATE_STORE_RESTRICTED_TO_WEB",
      message:
        "Pembuatan toko baru hanya dapat dilakukan melalui website resmi kami agar terhubung dengan lisensi aktif.",
      websiteUrl: "/onboarding",
    },
    { status: 403 }
  );
}
