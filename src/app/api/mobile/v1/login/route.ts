import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { signMobileToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Get user's store (assuming owner role for now)
    const store = await db.store.findFirst({
      where: { ownerId: user.id },
    });

    if (!store) {
      // User belum punya toko (Belum onboarding)
      const token = signMobileToken({
        userId: user.id,
        storeId: "",
      });

      return NextResponse.json({
        success: true,
        message: "Login berhasil, tapi belum memiliki toko",
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          store: null, // Tandai belum onboarding
        }
      });
    }

    const token = signMobileToken({
      userId: user.id,
      storeId: store.id,
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
        }
      }
    });

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
