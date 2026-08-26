import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/modules/admin/admin-header";
import { ProductForm } from "@/components/modules/product/product-form";
import { getProductById, getSuppliers, getCategories, getUnits } from "@/actions/product.actions";

interface EditProductPageProps {
  params: Promise<{ storeId: string; id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { storeId, id } = await params;

  const [productResult, suppliersResult, categoriesResult, unitsResult] = await Promise.all([
    getProductById(storeId, id),
    getSuppliers(storeId),
    getCategories(storeId),
    getUnits(storeId),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const rawProduct = productResult.data;
  const suppliers = suppliersResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const units = unitsResult.data ?? [];

  // Serialize Decimal to number
  const product = {
    ...rawProduct,
    buyPrice: Number(rawProduct.buyPrice),
    sellPrice: Number(rawProduct.sellPrice),
  };

  return (
    <>
      <AdminHeader title="Edit Produk" showBack />
      <ProductForm
        storeId={storeId}
        product={product}
        suppliers={suppliers}
        categories={categories}
        units={units}
      />
    </>
  );
}
