import { db } from "@/lib/prisma";
import { validateStoreAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { CategoryClient } from "./category-client";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  
  const storeDbId = await validateStoreAccess(storeId);
  if (!storeDbId) redirect("/");

  // Fetch categories with product count
  const categories = await db.category.findMany({
    where: { storeId: storeDbId },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto">
      <AdminHeader title="Kategori Produk" showBack />
      <CategoryClient storeId={storeId} categories={categories} />
    </div>
  );
}
