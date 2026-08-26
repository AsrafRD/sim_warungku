"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/actions/product.actions";
import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validations/product.schema";
import type { Product } from "@/generated/prisma/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ProductFormProps {
  storeId: string;
  /** If provided, the form is in "edit" mode */
  product?: any; // Serialized Product from Server Component
  /** Available suppliers for dropdown */
  suppliers: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  units: { id: string; name: string }[];
}

type FormErrors = Record<string, string[]>;

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function ProductForm({
  storeId,
  product,
  suppliers,
  categories,
  units,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!product;

  // Form state
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [buyPrice, setBuyPrice] = useState(
    product ? Number(product.buyPrice).toString() : ""
  );
  const [sellPrice, setSellPrice] = useState(
    product ? Number(product.sellPrice).toString() : ""
  );
  const [unitId, setUnitId] = useState(product?.unitId ?? "");
  const [currentStock, setCurrentStock] = useState(
    product ? product.currentStock.toString() : ""
  );
  const [minStockWarning, setMinStockWarning] = useState(
    product ? product.minStockWarning.toString() : "5"
  );
  const [supplierId, setSupplierId] = useState(product?.supplierId ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const formData = {
      name: name.trim(),
      categoryId: categoryId || "",
      sku: sku.trim(),
      barcode: barcode.trim(),
      unitId: unitId || "",
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      currentStock: Number(currentStock),
      minStockWarning: Number(minStockWarning),
      supplierId: supplierId || "",
    };

    // Client-side validation
    const schema = isEditing ? updateProductSchema : createProductSchema;
    const dataToValidate = isEditing
      ? { ...formData, id: product!.id }
      : formData;

    const parsed = schema.safeParse(dataToValidate);
    if (!parsed.success) {
      setErrors(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
      return;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(storeId, {
          id: product!.id,
            name: formData.name,
            categoryId: formData.categoryId,
            sku: formData.sku,
            barcode: formData.barcode,
            unitId: formData.unitId,
            buyPrice: formData.buyPrice,
            sellPrice: formData.sellPrice,
            minStockWarning: formData.minStockWarning,
            supplierId: formData.supplierId,
          })
        : await createProduct(storeId, formData);

      if (result.success) {
        router.push(`/${storeId}/products`);
        router.refresh();
      } else if (result.errors) {
        setErrors(result.errors);
      } else {
        setGlobalError(result.message ?? "Terjadi kesalahan");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {globalError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {globalError}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Produk</Label>
        <Input
          id="name"
          placeholder="Contoh: Indomie Goreng"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl"
        />
        <FieldError errors={errors} field="name" />
      </div>

      {/* Category */}
      {categories.length > 0 ? (
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors} field="categoryId" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <p className="text-sm text-slate-500">Belum ada kategori. Tambahkan di menu pengaturan/kategori.</p>
        </div>
      )}

      {/* SKU & Barcode side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            placeholder="Optional"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError errors={errors} field="sku" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            placeholder="Optional"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError errors={errors} field="barcode" />
        </div>
      </div>

      {/* Buy Price & Sell Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="buyPrice">Harga Beli</Label>
          <Input
            id="buyPrice"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError errors={errors} field="buyPrice" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sellPrice">Harga Jual</Label>
          <Input
            id="sellPrice"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError errors={errors} field="sellPrice" />
        </div>
      </div>

      {/* Unit select */}
      {units.length > 0 && (
        <div className="space-y-1.5">
          <Label>Satuan (Unit)</Label>
          <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Pilih satuan" />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors} field="unitId" />
        </div>
      )}

      {/* Stock (only on create) & Min Stock Warning */}
      <div className="grid grid-cols-2 gap-3">
        {!isEditing && (
          <div className="space-y-1.5">
            <Label htmlFor="currentStock">Stok Awal</Label>
            <Input
              id="currentStock"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="h-11 rounded-xl"
            />
            <FieldError errors={errors} field="currentStock" />
          </div>
        )}
        <div className={`space-y-1.5 ${isEditing ? "col-span-2" : ""}`}>
          <Label htmlFor="minStockWarning">Min. Stok Alert</Label>
          <Input
            id="minStockWarning"
            type="number"
            inputMode="numeric"
            placeholder="5"
            value={minStockWarning}
            onChange={(e) => setMinStockWarning(e.target.value)}
            className="h-11 rounded-xl"
          />
          <FieldError errors={errors} field="minStockWarning" />
        </div>
      </div>

      {/* Supplier select */}
      {suppliers.length > 0 && (
        <div className="space-y-1.5">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Pilih supplier (opsional)" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors} field="supplierId" />
        </div>
      )}

      {/* Submit button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              {isEditing ? "Memperbarui..." : "Menyimpan..."}
            </>
          ) : isEditing ? (
            "Perbarui Produk"
          ) : (
            "Simpan Produk"
          )}
        </Button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────
// Helper: Field Error Display
// ──────────────────────────────────────────────

function FieldError({
  errors,
  field,
}: {
  errors: FormErrors;
  field: string;
}) {
  const fieldErrors = errors[field];
  if (!fieldErrors?.length) return null;

  return (
    <p className="text-xs text-red-500 mt-1">{fieldErrors[0]}</p>
  );
}
