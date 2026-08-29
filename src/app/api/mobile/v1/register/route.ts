import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { signMobileToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
      },
    });

    const token = signMobileToken({
      userId: user.id,
      storeId: "", // StoreId kosong karena belum onboarding
    });

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      }
    });

  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server", error: error.message || String(error) },
      { status: 500 }
    );
  }
}
