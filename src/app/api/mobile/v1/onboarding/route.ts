import { NextResponse } from "next/server";

export async function POST() {
  // Sesuai aturan bisnis: Pembuatan toko dan lisensi eksklusif melalui website resmi
  return NextResponse.json(
    {
      success: false,
      code: "CREATE_STORE_RESTRICTED_TO_WEB",
      message:
        "Pembuatan toko baru dan aktivasi lisensi hanya dapat dilakukan melalui website resmi kami. Silakan masuk ke browser website untuk membuat toko.",
      websiteUrl: "/onboarding",
    },
    { status: 403 }
  );
}
