import { hashPassword, verifyPassword } from './password-hash';

describe('password-hash (scrypt)', () => {
  it('hashes and verifies a correct password', () => {
    const stored = hashPassword('correct-horse-battery');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('correct-horse-battery', stored)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const stored = hashPassword('correct-horse-battery');
    expect(verifyPassword('wrong-password!!', stored)).toBe(false);
  });

  it('rejects a malformed stored hash', () => {
    expect(verifyPassword('anything', 'not-a-hash')).toBe(false);
    expect(verifyPassword('anything', 'sha256$dead$beef')).toBe(false);
  });

  it('produces unique salts per call', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
    expect(verifyPassword('same-password', a)).toBe(true);
    expect(verifyPassword('same-password', b)).toBe(true);
  });
});
