import request from 'supertest';
import { app } from '../src/server';

describe('Reports & Analytics API', () => {
  let adminToken: string;
  let verticalUserToken: string;

  beforeAll(async () => {
    // Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@asapkerala.gov.in', password: 'password123' });
    adminToken = adminRes.body.data.token;

    // Login as Vertical User
    const verticalRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'training@asapkerala.gov.in', password: 'password123' });
    verticalUserToken = verticalRes.body.data.token;
  });

  describe('GET /api/finance/reports/overview', () => {
    it('should return overview data for Admin', async () => {
      const res = await request(app)
        .get('/api/finance/reports/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('revenueSplit');
      expect(res.body.data).toHaveProperty('expenseSplit');
    });

    it('should forbid Vertical User from accessing overview', async () => {
      const res = await request(app)
        .get('/api/finance/reports/overview')
        .set('Authorization', `Bearer ${verticalUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid unauthenticated access', async () => {
      const res = await request(app).get('/api/finance/reports/overview');
      expect(res.statusCode).toEqual(401);
    });
  });
});
