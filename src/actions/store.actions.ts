"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types/action-response";

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

export async function createStoreAction(
  data: z.infer<typeof createStoreSchema>
): Promise<ActionResponse<{ slug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Anda harus login terlebih dahulu" };
    }

    const parsed = createStoreSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, address } = parsed.data;
    const slug = generateSlug(name);

    const store = await db.store.create({
      data: {
        name,
        slug,
        address,
        ownerId: session.user.id,
      },
    });

    return { 
      success: true, 
      message: "Toko berhasil dibuat",
      data: { slug: store.slug }
    };
  } catch (error) {
    console.error("[createStoreAction]", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}
