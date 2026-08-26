import { AdminHeader } from "@/components/modules/admin/admin-header";
import { ProductForm } from "@/components/modules/product/product-form";
import { getSuppliers } from "@/actions/product.actions";

interface NewProductPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function NewProductPage({
  params,
}: NewProductPageProps) {
  const { storeId } = await params;

  // Fetch suppliers for the dropdown
  const suppliersResult = await getSuppliers(storeId);
  const suppliers = suppliersResult.data ?? [];

  return (
    <>
      <AdminHeader title="Tambah Produk" showBack />
      <ProductForm storeId={storeId} suppliers={suppliers} />
    </>
  );
}
