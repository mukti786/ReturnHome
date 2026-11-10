import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';

describe('Case Management & Duplicate Detection Tests', () => {
  let citizenCookie: string = '';

  beforeAll(async () => {
    if (!isMongoConnected) return;

    const email = `case.tester.${Date.now()}@example.com`;
    const password = 'Password123456!';

    await request(app)
      .post('/api/auth/register-citizen')
      .send({ name: 'Case Tester', email, password });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (loginRes.headers['set-cookie']) {
      citizenCookie = loginRes.headers['set-cookie'][0];
    }
  });

  it('POST /api/cases should validate required fields', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/cases')
      .set('Cookie', citizenCookie)
      .send({
        // Missing name, age, lastSeenLocation, description
        gender: 'Male'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/cases should create a valid missing person case', async () => {
    if (!isMongoConnected) return;

    const testCase = {
      name: 'Ravi Kumar',
      age: 28,
      gender: 'Male',
      height: '5 ft 10 in',
      weight: '70 kg',
      hairColor: 'Black',
      eyeColor: 'Brown',
      distinguishingFeatures: 'Mole on right cheek',
      lastSeenDate: '2026-10-15',
      lastSeenTime: '18:30',
      lastSeenLocation: 'Connaught Place Metro Station',
      latitude: 28.6328,
      longitude: 77.2195,
      description: 'Disappeared after leaving the metro exit.',
      clothingDescription: 'Blue formal shirt and dark trousers',
      priority: 'High',
      contactName: 'Suresh Kumar',
      contactPhone: '+91-9876543210'
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Cookie', citizenCookie)
      .send(testCase);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.case.caseId).toMatch(/^MP-\d{4}-\d{4}$/);
    expect(res.body.case.status).toBe('Submitted');
  });

  it('POST /api/cases/check-duplicate should identify potential duplicates', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/cases/check-duplicate')
      .set('Cookie', citizenCookie)
      .send({
        name: 'Ravi Kumar',
        age: 28,
        gender: 'Male'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hasPotentialDuplicates).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/cases/my should list cases submitted by the current citizen', async () => {
    if (!isMongoConnected) return;

    const res = await request(app)
      .post('/api/cases/my')
      .set('Cookie', citizenCookie);

    // Can be GET
    const getRes = await request(app)
      .get('/api/cases/my')
      .set('Cookie', citizenCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(Array.isArray(getRes.body.cases)).toBe(true);
  });
});
