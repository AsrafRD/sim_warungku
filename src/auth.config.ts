import type { NextAuthConfig } from "next-auth";

// Split config for edge compatibility (middleware)
export default {
  providers: [],
} satisfies NextAuthConfig;
