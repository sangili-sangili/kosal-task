const {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} = require('../../src/utils/jwt');

describe('JWT Utilities', () => {
  it('should generate and verify an access token with claims', () => {
    const payload = { sub: 101, email: 'test@enterprise.com', roles: ['ADMIN'] };
    const token = generateAccessToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(101);
    expect(decoded.email).toBe('test@enterprise.com');
    expect(decoded.roles).toContain('ADMIN');
  });

  it('should generate a cryptographically random refresh token', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();

    expect(token1).toHaveLength(80); // 40 bytes hex string
    expect(token2).toHaveLength(80);
    expect(token1).not.toEqual(token2);
  });

  it('should consistently hash refresh tokens using SHA-256', () => {
    const raw = 'random_refresh_token_string';
    const hash1 = hashRefreshToken(raw);
    const hash2 = hashRefreshToken(raw);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });
});
