"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { db } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types/action-response";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function registerAction(
  data: z.infer<typeof registerSchema>
): Promise<ActionResponse> {
  try {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, message: "Email sudah terdaftar" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
      },
    });

    return { success: true, message: "Pendaftaran berhasil, silakan login" };
  } catch (error) {
    console.error("[registerAction]", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function loginAction(
  data: z.infer<typeof loginSchema>
): Promise<ActionResponse> {
  try {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, message: "Email atau password salah" };
    }

    return { success: true, message: "Login berhasil" };
  } catch (error: any) {
    // NextAuth throws AuthError for specific login errors
    if (error?.type === "CredentialsSignin") {
      return { success: false, message: "Email atau password salah" };
    }
    // But it also throws a special redirect error that MUST be caught differently if redirecting, 
    // since we set redirect: false, this won't be thrown from NextAuth, but we must be careful.
    if (error?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[loginAction]", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}
