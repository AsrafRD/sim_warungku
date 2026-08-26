import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(2, "Nama supplier minimal 2 karakter"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Optional linking fields
  linkAccount: z.boolean().optional(),
  emailToLink: z.string().email("Format email tidak valid").optional().or(z.literal("")),
}).refine((data) => {
  if (data.linkAccount) {
    return !!data.emailToLink;
  }
  return true;
}, {
  message: "Email wajib diisi jika Anda ingin menautkan akun supplier",
  path: ["linkAccount"],
});
