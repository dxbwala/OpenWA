import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_PREFIX = 'scrypt';

/**
 * Hash a user-chosen password with Node's scrypt (slow KDF).
 * Format: scrypt$<saltHex>$<hashHex>
 *
 * Do NOT reuse the API-key SHA-256 hasher for passwords — keys are high-entropy;
 * passwords are not.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${SCRYPT_PREFIX}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) {
    return false;
  }
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  if (salt.length === 0 || expected.length === 0) {
    return false;
  }
  const actual = scryptSync(password, salt, expected.length);
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}
