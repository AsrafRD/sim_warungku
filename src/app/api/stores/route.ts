import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";

const createStoreSchema = z.object({
  name: z.string().min(3, "Nama toko minimal 3 karakter").max(100, "Nama toko maksimal 100 karakter"),
  address: z.string().optional(),
});

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 6);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Anda harus login terlebih dahulu" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createStoreSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { name, address } = parsed.data;
    const slug = generateSlug(name);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const store = await db.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name,
          slug,
          address,
          ownerId: userId,
        },
      });

      await tx.subscription.create({
        data: {
          storeId: newStore.id,
          plan: "TRIAL",
          status: "TRIAL",
          trialEndsAt,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
      });

      return newStore;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Toko berhasil dibuat",
      data: { slug: store.slug }
    });
  } catch (error) {
    console.error("[POST /api/stores]", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const stores = await db.store.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    console.error("[GET /api/stores]", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
