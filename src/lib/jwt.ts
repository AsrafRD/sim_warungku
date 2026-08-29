import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "warungku_super_secret_key_2026";

export interface MobileJWTPayload {
  userId: string;
  storeId: string;
}

export function signMobileToken(payload: MobileJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "30d", // Token valid for 30 days
  });
}

export function verifyMobileToken(token: string): MobileJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileJWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getAuthFromHeader(req: Request): Promise<MobileJWTPayload | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return verifyMobileToken(token);
}
