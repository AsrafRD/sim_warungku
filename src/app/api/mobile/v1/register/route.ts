import { NextResponse } from "next/server";

export async function POST() {
  // Sesuai aturan bisnis: Registrasi akun eksklusif melalui website resmi
  return NextResponse.json(
    {
      success: false,
      code: "REGISTER_RESTRICTED_TO_WEB",
      message:
        "Pendaftaran akun baru WarungKu hanya dapat dilakukan melalui website resmi kami. Silakan kunjungi website resmi untuk mendaftar akun dan memilih lisensi toko.",
      websiteUrl: "/",
    },
    { status: 403 }
  );
}
