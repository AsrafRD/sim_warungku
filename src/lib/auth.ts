import { auth } from "@/auth";
import { db } from "@/lib/prisma";

/** Returns the currently active storeId from the user's session. */
export async function getCurrentStoreId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // For now, return their first store
  const store = await db.store.findFirst({
    where: { ownerId: session.user.id }
  });
  
  return store?.slug || null;
}

/** Returns the current user's ID from the session. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Validates that the requesting user has access to a given storeId (slug).
 * Used in Server Actions and layouts to double-check tenant boundaries.
 */
export async function validateStoreAccess(storeSlug: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Check if they own this store
  const store = await db.store.findFirst({
    where: { 
      slug: storeSlug,
      ownerId: session.user.id
    },
    select: { id: true }
  });

  return store?.id || null;
}

/**
 * Validates that the requesting user has supplier access to a given storeId (slug).
 * Used in supplier layouts to protect supplier boundaries.
 */
export async function validateSupplierAccess(storeSlug: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supplier = await db.supplier.findFirst({
    where: {
      userId: session.user.id,
      store: { slug: storeSlug }
    },
    select: { storeId: true }
  });

  return supplier?.storeId || null;
}
