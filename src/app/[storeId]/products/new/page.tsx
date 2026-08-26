import { AdminHeader } from "@/components/modules/admin/admin-header";
import { ProductForm } from "@/components/modules/product/product-form";
import { getSuppliers, getCategories, getUnits } from "@/actions/product.actions";

interface NewProductPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function NewProductPage({
  params,
}: NewProductPageProps) {
  const { storeId } = await params;

  const [suppliersResult, categoriesResult, unitsResult] = await Promise.all([
    getSuppliers(storeId),
    getCategories(storeId),
    getUnits(storeId),
  ]);

  const suppliers = suppliersResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const units = unitsResult.data ?? [];

  return (
    <>
      <AdminHeader title="Tambah Produk" showBack />
      <ProductForm 
        storeId={storeId} 
        suppliers={suppliers}
        categories={categories}
        units={units}
      />
    </>
  );
}
