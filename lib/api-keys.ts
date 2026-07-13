/**
 * SecureLogTI - API Key Utilities
 * Generates and hashes device API keys used to authenticate log ingestion.
 *
 * Keys are shown to the user exactly once at creation time. Only a SHA-256
 * hash is stored in the database, so a leaked database cannot reveal usable
 * keys. The `prefix` (first chars of the plaintext key) is stored separately
 * so keys can be identified in the UI without exposing the secret.
 */

import { createHash, randomBytes } from "crypto"

const KEY_PREFIX = "slt_"

export interface GeneratedApiKey {
  /** The full plaintext key. Returned to the caller only once. */
  plaintext: string
  /** SHA-256 hash of the plaintext key, safe to persist. */
  keyHash: string
  /** Human-readable prefix for identifying the key in the UI. */
  prefix: string
}

/** Hash a plaintext API key for storage / lookup. */
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext.trim()).digest("hex")
}

/** Generate a fresh API key (plaintext + hash + display prefix). */
export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("hex")
  const plaintext = `${KEY_PREFIX}${secret}`
  return {
    plaintext,
    keyHash: hashApiKey(plaintext),
    // e.g. "slt_a1b2c3d4…" — enough to recognise, not enough to use.
    prefix: plaintext.slice(0, KEY_PREFIX.length + 8),
  }
}

/**
 * Extract an API key from a request's headers.
 * Accepts either `Authorization: Bearer <key>` or `x-api-key: <key>`.
 */
export function extractApiKey(headers: Headers): string | null {
  const auth = headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null
  }
  return headers.get("x-api-key")?.trim() || null
}
