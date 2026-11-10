import request from 'supertest';
import { app } from '../server';
import { isMongoConnected } from '../config/db';
import { createAndSendNotification } from '../utils/notificationService';

describe('Notification System Tests', () => {
  let userCookie: string = '';
  let userId: string = '';
  let testNotifId: string = '';

  beforeAll(async () => {
    if (!isMongoConnected) return;

    const email = `notif.user.${Date.now()}@example.com`;
    const password = 'Password123456!';
    await request(app)
      .post('/api/auth/register-citizen')
      .send({ name: 'Notification Tester', email, password });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (loginRes.headers['set-cookie']) {
      userCookie = loginRes.headers['set-cookie'][0];
    }
    if (loginRes.body.user) {
      userId = loginRes.body.user.id;
    }

    if (userId) {
      const doc = await createAndSendNotification({
        recipientId: userId,
        title: 'Welcome to ReturnHome',
        message: 'Your missing-person portal is ready for submissions.',
        type: 'system',
        link: '/dashboard'
      });
      if (doc) {
        testNotifId = doc.notificationId;
      }
    }
  });

  it('GET /api/notifications should return list with unreadCount', async () => {
    if (!isMongoConnected || !userCookie) return;

    const res = await request(app)
      .get('/api/notifications')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('GET /api/notifications/unread-count should return numeric count', async () => {
    if (!isMongoConnected || !userCookie) return;

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.count).toBe('number');
  });

  it('PUT /api/notifications/:id/read should mark a notification as read', async () => {
    if (!isMongoConnected || !userCookie || !testNotifId) return;

    const res = await request(app)
      .put(`/api/notifications/${testNotifId}/read`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notification.read).toBe(true);
  });

  it('PUT /api/notifications/read-all should mark all notifications as read', async () => {
    if (!isMongoConnected || !userCookie) return;

    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
