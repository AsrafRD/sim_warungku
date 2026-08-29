import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";
import { signMobileToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "ID Toko wajib diisi" }, { status: 400 });
    }

    // Pastikan user adalah pemilik toko
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        ownerId: auth.userId,
      },
    });

    if (!store) {
      return NextResponse.json({ success: false, message: "Toko tidak ditemukan atau Anda tidak memiliki akses" }, { status: 404 });
    }

    // Buat token baru yang berisi storeId yang baru
    const newToken = signMobileToken({
      userId: auth.userId,
      storeId: store.id,
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil ganti toko",
      data: {
        token: newToken,
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
        }
      }
    });

  } catch (error: any) {
    console.error("Mobile Stores Switch API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
