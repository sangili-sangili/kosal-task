const request = require('supertest');
const app = require('../../src/app');
const { testConnection, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/database/initDb');

describe('User API Integration Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    await testConnection();
    await initializeDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@enterprise.com',
        password: 'Admin@123456',
      });

    authToken = loginRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await closeConnection();
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should list users with pagination when authenticated as admin', async () => {
    const res = await request(app)
      .get('/api/v1/users?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('should create and then soft-delete a new user', async () => {
    // 1. Create user
    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Test',
        lastName: 'Engineer',
        email: `test.engineer.${Date.now()}@enterprise.com`,
        password: 'Password123!',
        phone: '+1-555-9999',
        status: 'ACTIVE',
      });

    expect(createRes.status).toBe(201);
    const createdId = createRes.body.data.id;

    // 2. Delete user
    const deleteRes = await request(app)
      .delete(`/api/v1/users/${createdId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
