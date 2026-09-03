import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { createSupplierSchema } from "@/lib/validations/supplier.schema";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    
    if (!storeId) {
      return NextResponse.json({ success: false, message: "storeId is required" }, { status: 400 });
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return NextResponse.json({ success: false, message: "Akses ke toko ditolak" }, { status: 403 });
    }

    const suppliers = await db.supplier.findMany({
      where: { storeId: storeDbId },
      include: {
        user: { select: { email: true } },
        _count: { select: { products: true } }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("[GET /api/suppliers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    
    if (!storeId) {
      return NextResponse.json({ success: false, message: "storeId is required" }, { status: 400 });
    }

    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSupplierSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    let userId: string | undefined = undefined;

    // Handle User Account Linking
    if (data.linkAccount && data.emailToLink) {
      const existingUser = await db.user.findUnique({
        where: { email: data.emailToLink }
      });

      if (!existingUser) {
        return NextResponse.json({ success: false, message: "Akun dengan email tersebut belum terdaftar di sistem. Pastikan Supplier sudah melakukan registrasi terlebih dahulu." }, { status: 400 });
      }

      if (existingUser.role !== "SUPPLIER") {
        return NextResponse.json({ success: false, message: "Email ini terdaftar sebagai Owner/Admin, bukan akun Supplier." }, { status: 400 });
      }

      // Validasi kuota toko supplier (10 toko per token)
      const linkedStoresCount = await db.supplier.count({
        where: { userId: existingUser.id },
      });
      const maxQuota = existingUser.supplierStoreQuota || 10;

      if (linkedStoresCount >= maxQuota) {
        return NextResponse.json({
          success: false,
          message: `Supplier ini telah mencapai batas kuota (${maxQuota} toko). Supplier wajib membeli token kuota tambahan (+10 toko) di portal supplier terlebih dahulu.`,
        }, { status: 400 });
      }

      userId = existingUser.id;
    }

    // Create Supplier Profile
    const supplier = await db.supplier.create({
      data: {
        storeId: storeDbId,
        userId: userId,
        name: data.name,
        contactName: data.contactName || null,
        phone: data.phone || null,
        address: data.address || null,
      },
      include: {
        user: { select: { email: true } },
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({ success: true, message: "Supplier berhasil ditambahkan", data: supplier });
  } catch (error) {
    console.error("[POST /api/suppliers]", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
