import { verifyMobileToken, MobileJWTPayload } from "./jwt";

export function getAuthFromHeader(req: Request): MobileJWTPayload | null {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  const payload = verifyMobileToken(token);
  return payload;
}
