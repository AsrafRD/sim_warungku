/**
 * Format a number or Prisma Decimal to Indonesian Rupiah currency string.
 * Accepts `number`, `string`, or any object with `.toString()` (e.g., Prisma Decimal).
 * @example formatRupiah(25000) => "Rp 25.000"
 * @example formatRupiah(1500000) => "Rp 1.500.000"
 */
export function formatRupiah(amount: number | { toString(): string }): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a number with Indonesian locale thousand separators.
 * @example formatNumber(12500) => "12.500"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Format a Date to Indonesian locale date string.
 * @example formatDate(new Date()) => "26 Agustus 2026"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format a Date to short Indonesian locale string.
 * @example formatDateShort(new Date()) => "26/08/2026"
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
