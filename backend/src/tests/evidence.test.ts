import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';

describe('Evidence Center Tests', () => {
  let citizenCookie: string = '';

  beforeAll(async () => {
    if (!isMongoConnected) return;

    const email = `evidence.tester.${Date.now()}@example.com`;
    const password = 'Password123456!';
    await request(app)
      .post('/api/auth/register-citizen')
      .send({ name: 'Evidence Tester', email, password });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (loginRes.headers['set-cookie']) {
      citizenCookie = loginRes.headers['set-cookie'][0];
    }
  });

  it('GET /api/evidence should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/evidence');
    expect(res.status).toBe(401);
  });

  it('GET /api/evidence should return structured evidence list for authenticated user', async () => {
    if (!isMongoConnected || !citizenCookie) return;

    const res = await request(app)
      .get('/api/evidence')
      .set('Cookie', citizenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.evidence)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('GET /api/evidence with source filter should execute cleanly', async () => {
    if (!isMongoConnected || !citizenCookie) return;

    const res = await request(app)
      .get('/api/evidence?source=live_camera')
      .set('Cookie', citizenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.evidence)).toBe(true);
  });
});
