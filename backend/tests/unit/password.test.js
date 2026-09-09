const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('Password Utility', () => {
  it('should hash a password securely using bcrypt', async () => {
    const raw = 'SecretPassword123!';
    const hashed = await hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith('$2')).toBe(true); // standard bcrypt prefix
  });

  it('should correctly verify valid passwords', async () => {
    const raw = 'CorrectPassword@123';
    const hashed = await hashPassword(raw);

    const isValid = await comparePassword(raw, hashed);
    expect(isValid).toBe(true);
  });

  it('should reject invalid passwords', async () => {
    const raw = 'CorrectPassword@123';
    const wrong = 'WrongPassword@123';
    const hashed = await hashPassword(raw);

    const isValid = await comparePassword(wrong, hashed);
    expect(isValid).toBe(false);
  });
});
