"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types/action-response";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["OWNER", "SUPPLIER"]).default("OWNER"),
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

    const { name, email, password, role } = parsed.data;

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
        role: role,
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
): Promise<ActionResponse & { redirectUrl?: string }> {
  try {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data tidak valid",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return { success: false, message: "Email atau password salah" };
      }
      // Re-throw if it's Next.js redirect
      throw authErr;
    }

    // Determine redirect URL
    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      include: { ownedStores: { select: { slug: true } } },
    });

    let redirectUrl = "/onboarding";
    if (user) {
      if (user.role === "SUPPLIER") {
        redirectUrl = "/supplier";
      } else if (user.ownedStores.length === 1) {
        redirectUrl = `/${user.ownedStores[0].slug}/products`;
      } else if (user.ownedStores.length > 1) {
        redirectUrl = "/stores";
      }
    }

    return { success: true, message: "Login berhasil", redirectUrl };
  } catch (error) {
    const err = error as Error & { type?: string };
    if (err?.type === "CredentialsSignin") {
      return { success: false, message: "Email atau password salah" };
    }
    if (err?.message?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[loginAction]", error);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}
