import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is not set. " +
      "Please set a strong random secret (e.g. openssl rand -hex 32)."
    );
  }
  return JWT_SECRET;
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Check cookie
  const cookie = req.cookies.get("auth_token");
  return cookie?.value ?? null;
}

export function requireAuth(
  req: NextRequest
): { payload: JwtPayload } | { error: string; status: number } {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }
  const payload = verifyToken(token);
  if (!payload) {
    return { error: "Invalid or expired token", status: 401 };
  }
  return { payload };
}
