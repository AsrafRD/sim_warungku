import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthFromHeader } from "@/lib/jwt";
import { signMobileToken } from "@/lib/jwt";
import slugify from "slugify";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const stores = await db.store.findMany({
      where: { ownerId: auth.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    console.error("Mobile Stores GET API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromHeader(req);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Nama toko wajib diisi" }, { status: 400 });
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
    console.error("Mobile Stores POST API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
