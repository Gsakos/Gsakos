import crypto from "crypto";

/** URL-safe random token used for draft-owner links and per-party signing links. */
export function generateToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function generateId(): string {
  return crypto.randomUUID();
}
