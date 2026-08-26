"use server";

import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types/action-response";

// ──────────────────────────────────────────────
// CATEGORY ACTIONS
// ──────────────────────────────────────────────

export async function createCategory(
  storeId: string,
  name: string
): Promise<ActionResponse> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    if (!name || name.trim().length === 0) {
      return { success: false, message: "Nama kategori tidak boleh kosong" };
    }

    await db.category.create({
      data: {
        name: name.trim(),
        storeId: storeDbId,
      }
    });

    return { success: true, message: "Kategori berhasil ditambahkan" };
  } catch (error) {
    console.error("[createCategory]", error);
    return { success: false, message: "Gagal menambahkan kategori" };
  }
}

export async function deleteCategory(
  storeId: string,
  id: string
): Promise<ActionResponse> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    await db.category.delete({
      where: { id, storeId: storeDbId }
    });

    return { success: true, message: "Kategori berhasil dihapus" };
  } catch (error) {
    console.error("[deleteCategory]", error);
    return { success: false, message: "Gagal menghapus kategori" };
  }
}

// ──────────────────────────────────────────────
// UNIT ACTIONS
// ──────────────────────────────────────────────

export async function createUnit(
  storeId: string,
  name: string
): Promise<ActionResponse> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    if (!name || name.trim().length === 0) {
      return { success: false, message: "Nama satuan tidak boleh kosong" };
    }

    await db.unit.create({
      data: {
        name: name.trim(),
        storeId: storeDbId,
      }
    });

    return { success: true, message: "Satuan berhasil ditambahkan" };
  } catch (error) {
    console.error("[createUnit]", error);
    return { success: false, message: "Gagal menambahkan satuan" };
  }
}

export async function deleteUnit(
  storeId: string,
  id: string
): Promise<ActionResponse> {
  try {
    const storeDbId = await validateStoreAccess(storeId);
    if (!storeDbId) return { success: false, message: "Akses ditolak" };

    await db.unit.delete({
      where: { id, storeId: storeDbId }
    });

    return { success: true, message: "Satuan berhasil dihapus" };
  } catch (error) {
    console.error("[deleteUnit]", error);
    return { success: false, message: "Gagal menghapus satuan" };
  }
}
