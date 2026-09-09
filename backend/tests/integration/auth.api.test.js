const request = require('supertest');
const app = require('../../src/app');
const { testConnection, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/database/initDb');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await testConnection();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeConnection();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully authenticate super admin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@enterprise.com',
          password: 'Admin@123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@enterprise.com');
      expect(response.body.data.user.roles).toContain('SUPER_ADMIN');
    });

    it('should return 401 when invalid password is provided', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@enterprise.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 400 when validation fails on malformed email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'pass',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /healthz and /readyz', () => {
    it('should return 200 OK for healthz probe', async () => {
      const response = await request(app).get('/healthz');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('UP');
    });
  });
});
