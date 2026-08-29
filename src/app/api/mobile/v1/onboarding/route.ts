import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/api-auth";
import { signMobileToken } from "@/lib/jwt";
import slugify from "slugify";

export async function POST(req: Request) {
  try {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama toko wajib diisi" }, { status: 400 });
    }

    // Periksa apakah user sudah punya toko
    const existingStore = await db.store.findFirst({
      where: { ownerId: auth.userId },
    });

    if (existingStore) {
      // Jika user sudah memiliki toko, kembalikan saja token untuk toko tersebut
      const token = signMobileToken({
        userId: auth.userId,
        storeId: existingStore.id,
      });
      return NextResponse.json({
        success: true,
        message: "Anda sudah memiliki toko.",
        data: {
          token,
          store: {
            id: existingStore.id,
            name: existingStore.name,
            slug: existingStore.slug,
          }
        }
      });
    }

    const slug = slugify(name, { lower: true, strict: true });
    
    // Pastikan slug unik
    const slugExists = await db.store.findUnique({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const store = await db.store.create({
      data: {
        name,
        slug: finalSlug,
        ownerId: auth.userId,
        phone,
        address,
      },
    });

    // Buat token baru yang berisi storeId
    const newToken = signMobileToken({
      userId: auth.userId,
      storeId: store.id,
    });

    return NextResponse.json({
      success: true,
      message: "Toko berhasil dibuat",
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
    console.error("Onboarding API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
