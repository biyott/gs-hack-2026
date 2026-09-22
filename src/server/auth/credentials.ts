import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const pinHashPattern = /^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(pin, salt, 64).toString("hex");
  return `scrypt-v1$${salt}$${key}`;
}

export function verifyPin(pin: string, storedHash: string): boolean {
  const match = pinHashPattern.exec(storedHash);
  const salt = match?.[1];
  const key = match?.[2];
  if (salt === undefined || key === undefined) return false;
  return timingSafeEqual(scryptSync(pin, salt, 64), Buffer.from(key, "hex"));
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
