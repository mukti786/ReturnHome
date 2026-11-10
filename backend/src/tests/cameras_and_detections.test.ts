import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';

describe('Cameras & Live Detection Pipeline Tests', () => {
  let authCookie: string = '';

  beforeAll(async () => {
    if (!isMongoConnected) return;

    // Register & login citizen or use demo
    const email = `cam.tester.${Date.now()}@example.com`;
    const password = 'Password123456!';

    await request(app)
      .post('/api/auth/register-citizen')
      .send({ name: 'Cam Tester', email, password });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (loginRes.headers['set-cookie']) {
      authCookie = loginRes.headers['set-cookie'][0];
    }
  });

  it('GET /api/cameras should return list of cameras', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .get('/api/cameras')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.cameras)).toBe(true);
  });

  it('GET /api/detections should return detections requiring review', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .get('/api/detections')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.detections)).toBe(true);
    expect(res.body.disclaimer).toBeDefined();
  });

  it('GET /api/videos should list video investigation jobs', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .get('/api/videos')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});
