import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';

describe('Sightings Workflow Tests', () => {
  let citizenCookie: string = '';
  let investigatorCookie: string = '';
  let testCaseRef: string = '';
  let createdSightingId: string = '';

  beforeAll(async () => {
    if (!isMongoConnected) return;

    // Register Citizen
    const citizenEmail = `sighting.citizen.${Date.now()}@example.com`;
    const password = 'Password123456!';
    await request(app)
      .post('/api/auth/register-citizen')
      .send({ name: 'Sighting Citizen', email: citizenEmail, password });

    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: citizenEmail, password });

    if (citizenLogin.headers['set-cookie']) {
      citizenCookie = citizenLogin.headers['set-cookie'][0];
    }

    // Register & Login Investigator (using demo or admin credentials)
    const investigatorEmail = `sighting.inv.${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Lead Investigator', email: investigatorEmail, password, organization: 'CID Missing Persons Unit' });

    // Login citizen creates a test case
    const caseRes = await request(app)
      .post('/api/cases')
      .set('Cookie', citizenCookie)
      .send({
        name: 'Anita Verma',
        age: 24,
        gender: 'Female',
        height: '5 ft 4 in',
        weight: '55 kg',
        hairColor: 'Brown',
        eyeColor: 'Black',
        distinguishingFeatures: 'Scar on left elbow',
        lastSeenDate: '2026-11-01',
        lastSeenTime: '14:00',
        lastSeenLocation: 'Sector 18 Market, Noida',
        latitude: 28.5708,
        longitude: 77.3271,
        description: 'Last observed walking towards metro gate 2.',
        clothingDescription: 'Yellow kurta and white salwar'
      });

    if (caseRes.body.success && caseRes.body.case) {
      testCaseRef = caseRes.body.case.caseId;
    }
  });

  it('POST /api/sightings should reject incomplete submissions', async () => {
    if (!isMongoConnected || !testCaseRef) return;

    const res = await request(app)
      .post('/api/sightings')
      .set('Cookie', citizenCookie)
      .send({
        caseRef: testCaseRef
        // Missing location and notes
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/sightings should submit valid sighting with GPS metadata', async () => {
    if (!isMongoConnected || !testCaseRef) return;

    const res = await request(app)
      .post('/api/sightings')
      .set('Cookie', citizenCookie)
      .send({
        caseRef: testCaseRef,
        location: 'Tea Stall near Botanical Garden Metro',
        latitude: 28.5644,
        longitude: 77.3344,
        locationSource: 'citizen_gps',
        dateTimeSeen: new Date().toISOString(),
        notes: 'Spotted someone closely matching the description wearing yellow attire.',
        clothingSeen: 'Yellow kurta'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.sighting).toBeDefined();
    expect(res.body.sighting.status).toBe('Pending Review');
    expect(res.body.sighting.locationSource).toBe('citizen_gps');
    createdSightingId = res.body.sighting.sightingId;
  });

  it('GET /api/sightings should list submitted sightings', async () => {
    if (!isMongoConnected || !createdSightingId) return;

    const res = await request(app)
      .get('/api/sightings')
      .set('Cookie', citizenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.sightings)).toBe(true);
    const found = res.body.sightings.some((s: any) => s.sightingId === createdSightingId);
    expect(found).toBe(true);
  });

  it('GET /api/sightings/:id should retrieve specific sighting details', async () => {
    if (!isMongoConnected || !createdSightingId) return;

    const res = await request(app)
      .get(`/api/sightings/${createdSightingId}`)
      .set('Cookie', citizenCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sighting.sightingId).toBe(createdSightingId);
  });

  it('PUT /api/sightings/:id/review should reject citizen review attempts (RBAC)', async () => {
    if (!isMongoConnected || !createdSightingId) return;

    const res = await request(app)
      .put(`/api/sightings/${createdSightingId}/review`)
      .set('Cookie', citizenCookie)
      .send({ status: 'Verified', reviewNotes: 'Self-approval attempt' });

    // Citizen cannot review sightings
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
