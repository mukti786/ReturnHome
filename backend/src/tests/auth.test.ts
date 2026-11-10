import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';

describe('Authentication & RBAC System Tests', () => {
  const testCitizen = {
    name: 'Citizen Alice',
    email: `citizen.${Date.now()}@example.com`,
    password: 'Password123456!',
    phone: '+15550192834'
  };

  const testInvestigator = {
    name: 'Officer Bob',
    email: `investigator.${Date.now()}@example.com`,
    password: 'Password123456!',
    organization: 'City Missing Persons Unit'
  };

  it('GET /api should return system status', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.app).toContain('ReturnHome');
    expect(res.body.disclaimer).toBeDefined();
  });

  it('POST /api/auth/register-citizen should register active Citizen account', async () => {
    if (!isMongoConnected) {
      const res = await request(app).post('/api/auth/register-citizen').send(testCitizen);
      expect([201, 503]).toContain(res.status);
      return;
    }

    const res = await request(app)
      .post('/api/auth/register-citizen')
      .send(testCitizen);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('Citizen');
    expect(res.body.user.status).toBe('Active');
  });

  it('POST /api/auth/register should register Investigator as Pending approval', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/auth/register')
      .send(testInvestigator);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('Investigator');
    expect(res.body.user.status).toBe('Pending');
  });

  it('POST /api/auth/login should prevent pending investigator from logging in', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testInvestigator.email, password: testInvestigator.password });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('pending administrator approval');
  });

  it('POST /api/auth/login should allow active Citizen to log in and receive cookie', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testCitizen.email, password: testCitizen.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/google should handle missing Google Client ID appropriately', async () => {
    if (!isMongoConnected) return;

    // Normal token without Google Client ID configured
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'real-google-id-token', role: 'Citizen' });

    // Expect 503 or 401 if unconfigured/invalid
    expect([400, 401, 503]).toContain(res.status);
  });

  it('POST /api/auth/google should accept simulated test credentials in test environment', async () => {
    if (!isMongoConnected) return;

    const testGoogleEmail = `google.user.${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/google')
      .send({
        credential: `test-google-token-:${testGoogleEmail}:Google User:sub-${Date.now()}`,
        role: 'Citizen'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testGoogleEmail);
    expect(res.body.user.role).toBe('Citizen');
  });

  it('Protected route /api/cases should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/cases');
    expect(res.status).toBe(401);
  });
});
