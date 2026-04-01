import { createHash } from 'crypto';

/**
 * Deterministic SHA-256 hash for premium codes.
 * Codes are uppercased and trimmed before hashing so that
 * lookups are case-insensitive and whitespace-tolerant.
 */
export function hashPremiumCode(code: string): string {
  return createHash('sha256')
    .update(code.trim().toUpperCase())
    .digest('hex');
}
