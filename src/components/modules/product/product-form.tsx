"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Loader2,
  Plus,
  Package,
  Tag,
  Ruler,
  Truck,
  Barcode,
  CircleDollarSign,
  Boxes,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { createCategory, createUnit } from "@/actions/settings.actions";

import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validations/product.schema";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ProductFormProps {
  storeId: string;
  product?: any;
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
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl ?? "");

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

  const [supplierId, setSupplierId] = useState(
    product?.supplierId ?? ""
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");

  // ──────────────────────────────────────────────
  // Quick Add Category
  // ──────────────────────────────────────────────

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const result = await createCategory(
        storeId,
        newCategoryName
      );

      if (result.success) {
        setIsCategoryModalOpen(false);
        setNewCategoryName("");
        router.refresh();
      } else {
        setGlobalError(
          result.message || "Gagal menambah kategori"
        );
      }
    });
  };

  // ──────────────────────────────────────────────
  // Quick Add Unit
  // ──────────────────────────────────────────────

  const handleQuickAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUnitName.trim()) return;

    startTransition(async () => {
      const result = await createUnit(
        storeId,
        newUnitName
      );

      if (result.success) {
        setIsUnitModalOpen(false);
        setNewUnitName("");
        router.refresh();
      } else {
        setGlobalError(
          result.message || "Gagal menambah satuan"
        );
      }
    });
  };

  // ──────────────────────────────────────────────
  // Submit
  // ──────────────────────────────────────────────

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
      imageUrl: imageUrl || "",
    };

    const schema = isEditing
      ? updateProductSchema
      : createProductSchema;

    const dataToValidate = isEditing
      ? { ...formData, id: product!.id }
      : formData;

    const parsed = schema.safeParse(dataToValidate);

    if (!parsed.success) {
      setErrors(
        parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >
      );

      return;
    }

    startTransition(async () => {
      try {
        const url = isEditing
          ? `/api/products/${product.id}?storeId=${storeId}`
          : `/api/products?storeId=${storeId}`;

        const method = isEditing ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToValidate),
        });

        const result = await response.json();

        if (result.success) {
          router.push(`/${storeId}/products`);
          router.refresh();
        } else if (result.errors) {
          setErrors(result.errors);
        } else {
          setGlobalError(
            result.message ?? "Terjadi kesalahan"
          );
        }
      } catch {
        setGlobalError("Terjadi kesalahan jaringan");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-full bg-[#F5F5DC]/50 px-4 py-5 pb-28"
    >
      <div className="mx-auto w-full max-w-2xl space-y-4">

        {/* =====================================================
            FORM HEADER
        ===================================================== */}

        <div className="rounded-2xl border border-[#E8DFB5] bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00]">
              <Package className="size-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                {isEditing
                  ? "Edit Produk"
                  : "Tambah Produk"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {isEditing
                  ? "Perbarui informasi produk dan stok."
                  : "Lengkapi informasi produk untuk mulai menjual."}
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            FOTO PRODUK
        ===================================================== */}

        <FormSection
          icon={<ImageIcon className="size-4" />}
          title="Foto Produk (Opsional)"
          description="Tambahkan gambar agar produk mudah dikenali"
        >
          <div className="space-y-3">
            {imageUrl ? (
              <div className="relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-[#E8DFB5] bg-slate-50">
                <Image
                  src={imageUrl}
                  alt="Product preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-red-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result: any) => {
                  if (result.info?.secure_url) {
                    setImageUrl(result.info.secure_url);
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open?.()}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E8DFB5] bg-[#F5F5DC]/40 text-slate-500 transition-colors hover:border-[#FF8F00] hover:bg-[#FFF0D6] active:scale-[0.99]"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Plus className="size-5 text-[#FF8F00]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Klik untuk unggah foto</span>
                    <span className="text-xs font-medium text-slate-400">Maks. 5MB</span>
                  </button>
                )}
              </CldUploadWidget>
            )}
            <FieldError errors={errors} field="imageUrl" />
          </div>
        </FormSection>

        {/* =====================================================
            GLOBAL ERROR
        ===================================================== */}

        {globalError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {globalError}
          </div>
        )}


        {/* =====================================================
            INFORMASI PRODUK
        ===================================================== */}

        <FormSection
          icon={<Tag className="size-4" />}
          title="Informasi Produk"
          description="Informasi dasar produk"
        >

          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-slate-700"
            >
              Nama Produk
            </Label>

            <Input
              id="name"
              placeholder="Contoh: Indomie Goreng"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border-[#DDD6B8] bg-white focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
            />

            <FieldError errors={errors} field="name" />
          </div>


          {/* Category */}
          <div className="space-y-1.5">

            <div className="flex items-center justify-between">

              <Label className="text-xs font-semibold text-slate-700">
                Kategori
              </Label>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#FF8F00] transition-colors hover:text-[#E98200]"
              >
                <Plus className="size-3.5" />
                Kategori Baru
              </button>

            </div>

            {categories.length > 0 ? (

              <Select
                value={categoryId}
                onValueChange={(v) =>
                  setCategoryId(v ?? "")
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-[#DDD6B8] bg-white focus:ring-[#FF8F00]/20">
                  <SelectValue placeholder="Pilih kategori">
                    {categories.find(
                      (c) => c.id === categoryId
                    )?.name}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            ) : (

              <EmptySelect text="Belum ada kategori" />

            )}

            <FieldError
              errors={errors}
              field="categoryId"
            />

          </div>


          {/* Unit */}
          <div className="space-y-1.5">

            <div className="flex items-center justify-between">

              <Label className="text-xs font-semibold text-slate-700">
                Satuan
              </Label>

              <button
                type="button"
                onClick={() => setIsUnitModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#FF8F00] transition-colors hover:text-[#E98200]"
              >
                <Plus className="size-3.5" />
                Satuan Baru
              </button>

            </div>

            {units.length > 0 ? (

              <Select
                value={unitId}
                onValueChange={(v) =>
                  setUnitId(v ?? "")
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-[#DDD6B8] bg-white focus:ring-[#FF8F00]/20">
                  <SelectValue placeholder="Pilih satuan">
                    {units.find(
                      (u) => u.id === unitId
                    )?.name}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {units.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                    >
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            ) : (

              <EmptySelect text="Belum ada satuan" />

            )}

            <FieldError
              errors={errors}
              field="unitId"
            />

          </div>


          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">

            <FormInput
              id="sku"
              label="SKU"
              placeholder="Optional"
              value={sku}
              onChange={setSku}
              icon={<Package className="size-3.5" />}
              error={errors.sku?.[0]}
            />

            <FormInput
              id="barcode"
              label="Barcode"
              placeholder="Optional"
              value={barcode}
              onChange={setBarcode}
              icon={<Barcode className="size-3.5" />}
              error={errors.barcode?.[0]}
            />

          </div>

        </FormSection>


        {/* =====================================================
            HARGA
        ===================================================== */}

        <FormSection
          icon={<CircleDollarSign className="size-4" />}
          title="Harga Produk"
          description="Tentukan harga beli dan harga jual"
        >

          <div className="grid grid-cols-2 gap-3">

            <PriceInput
              id="buyPrice"
              label="Harga Beli"
              value={buyPrice}
              onChange={setBuyPrice}
              error={errors.buyPrice?.[0]}
            />

            <PriceInput
              id="sellPrice"
              label="Harga Jual"
              value={sellPrice}
              onChange={setSellPrice}
              error={errors.sellPrice?.[0]}
              highlight
            />

          </div>

        </FormSection>


        {/* =====================================================
            STOK
        ===================================================== */}

        <FormSection
          icon={<Boxes className="size-4" />}
          title="Persediaan"
          description="Atur jumlah stok dan batas peringatan"
        >

          <div className="grid grid-cols-2 gap-3">

            <FormInput
              id="currentStock"
              label={isEditing ? "Restock / Ubah Stok" : "Stok Awal"}
              placeholder="0"
              type="number"
              value={currentStock}
              onChange={setCurrentStock}
              error={errors.currentStock?.[0]}
            />

            <FormInput
              id="minStockWarning"
              label="Min. Stok Alert"
              placeholder="5"
              type="number"
              value={minStockWarning}
              onChange={setMinStockWarning}
              error={errors.minStockWarning?.[0]}
            />

          </div>

          <div className="flex items-start gap-2 rounded-xl bg-[#FFF8E1] p-3 text-xs text-[#8A6500]">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#FBC02D]" />

            <p>
              Produk akan ditandai sebagai stok menipis
              ketika jumlah stok mencapai batas minimum.
            </p>
          </div>

        </FormSection>


        {/* =====================================================
            SUPPLIER
        ===================================================== */}

        {suppliers.length > 0 && (
          <FormSection
            icon={<Truck className="size-4" />}
            title="Supplier"
            description="Supplier utama produk"
          >

            <div className="space-y-1.5">

              <Label className="text-xs font-semibold text-slate-700">
                Supplier
              </Label>

              <Select
                value={supplierId}
                onValueChange={(v) =>
                  setSupplierId(v ?? "")
                }
              >

                <SelectTrigger className="h-11 w-full rounded-xl border-[#DDD6B8] bg-white focus:ring-[#FF8F00]/20">

                  <span className="flex flex-1 truncate text-left">

                    {supplierId ? (
                      suppliers.find(
                        (s) => s.id === supplierId
                      )?.name || "Pilih supplier"
                    ) : (
                      <span className="text-muted-foreground">
                        Pilih supplier (opsional)
                      </span>
                    )}

                  </span>

                </SelectTrigger>

                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>

              </Select>

              <FieldError
                errors={errors}
                field="supplierId"
              />

            </div>

          </FormSection>
        )}


        {/* =====================================================
            SUBMIT
        ===================================================== */}

        <div className="pt-1">

          <Button
            type="submit"
            disabled={isPending}
            className="
              h-12
              w-full
              rounded-xl
              bg-[#FF8F00]
              text-sm
              font-bold
              text-white
              shadow-[0_6px_18px_rgba(255,143,0,0.25)]
              transition-all
              hover:bg-[#E98200]
              hover:shadow-[0_8px_22px_rgba(255,143,0,0.3)]
              active:scale-[0.98]
            "
          >

            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                {isEditing
                  ? "Memperbarui..."
                  : "Menyimpan..."}
              </>
            ) : (
              <>
                {isEditing
                  ? "Perbarui Produk"
                  : "Simpan Produk"}
              </>
            )}

          </Button>

        </div>

      </div>


      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      <Dialog
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      >

        <DialogContent className="rounded-2xl border-[#E8DFB5] sm:max-w-[425px]">

          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">
              Tambah Kategori Baru
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">

            <Label
              htmlFor="newCategoryName"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Nama Kategori
            </Label>

            <Input
              id="newCategoryName"
              placeholder="Contoh: Makanan Ringan"
              value={newCategoryName}
              onChange={(e) =>
                setNewCategoryName(e.target.value)
              }
              className="h-11 rounded-xl border-[#DDD6B8] focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
              autoFocus
            />

          </div>

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsCategoryModalOpen(false)
              }
              className="h-10 rounded-xl border-[#DDD6B8]"
            >
              Batal
            </Button>

            <Button
              type="button"
              onClick={handleQuickAddCategory}
              disabled={
                isPending ||
                !newCategoryName.trim()
              }
              className="h-10 rounded-xl bg-[#FF8F00] font-bold text-white hover:bg-[#E98200]"
            >
              {isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Simpan
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


      {/* =====================================================
          UNIT MODAL
      ===================================================== */}

      <Dialog
        open={isUnitModalOpen}
        onOpenChange={setIsUnitModalOpen}
      >

        <DialogContent className="rounded-2xl border-[#E8DFB5] sm:max-w-[425px]">

          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800">
              Tambah Satuan Baru
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">

            <Label
              htmlFor="newUnitName"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Nama Satuan
            </Label>

            <Input
              id="newUnitName"
              placeholder="Contoh: PCS, KG, DUS"
              value={newUnitName}
              onChange={(e) =>
                setNewUnitName(e.target.value)
              }
              className="h-11 rounded-xl border-[#DDD6B8] uppercase focus-visible:border-[#FF8F00] focus-visible:ring-[#FF8F00]/20"
              autoFocus
            />

          </div>

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsUnitModalOpen(false)
              }
              className="h-10 rounded-xl border-[#DDD6B8]"
            >
              Batal
            </Button>

            <Button
              type="button"
              onClick={handleQuickAddUnit}
              disabled={
                isPending ||
                !newUnitName.trim()
              }
              className="h-10 rounded-xl bg-[#FF8F00] font-bold text-white hover:bg-[#E98200]"
            >
              {isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Simpan
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </form>
  );
}


// ──────────────────────────────────────────────
// Form Section
// ──────────────────────────────────────────────

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E8DFB5] bg-white p-4 shadow-sm">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0D6] text-[#FF8F00]">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            {title}
          </h3>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {description}
          </p>
        </div>

      </div>

      <div className="space-y-4">
        {children}
      </div>

    </section>
  );
}


// ──────────────────────────────────────────────
// Form Input
// ──────────────────────────────────────────────

function FormInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  error,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">

      <Label
        htmlFor={id}
        className="text-xs font-semibold text-slate-700"
      >
        {label}
      </Label>

      <div className="relative">

        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <Input
          id={id}
          type={type}
          inputMode={
            type === "number"
              ? "numeric"
              : undefined
          }
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`
            h-11
            rounded-xl
            border-[#DDD6B8]
            bg-white
            focus-visible:border-[#FF8F00]
            focus-visible:ring-[#FF8F00]/20
            ${icon ? "pl-9" : ""}
          `}
        />

      </div>

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}


// ──────────────────────────────────────────────
// Price Input
// ──────────────────────────────────────────────

function PriceInput({
  id,
  label,
  value,
  onChange,
  error,
  highlight = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1.5">

      <Label
        htmlFor={id}
        className="text-xs font-semibold text-slate-700"
      >
        {label}
      </Label>

      <div className="relative">

        <span
          className={`
            absolute left-3 top-1/2 -translate-y-1/2
            text-xs font-bold
            ${highlight
              ? "text-[#FF8F00]"
              : "text-slate-400"}
          `}
        >
          Rp
        </span>

        <Input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`
            h-11
            rounded-xl
            pl-10
            font-semibold
            border-[#DDD6B8]
            focus-visible:border-[#FF8F00]
            focus-visible:ring-[#FF8F00]/20
            ${highlight
              ? "bg-[#FFF9ED]"
              : "bg-white"}
          `}
        />

      </div>

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}


// ──────────────────────────────────────────────
// Empty Select
// ──────────────────────────────────────────────

function EmptySelect({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex h-11 items-center justify-center rounded-xl border border-dashed border-[#DDD6B8] bg-[#FAF9EE] text-xs font-medium text-slate-400">
      {text}
    </div>
  );
}


// ──────────────────────────────────────────────
// Field Error
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
    <p className="mt-1 text-xs text-red-500">
      {fieldErrors[0]}
    </p>
  );
}
