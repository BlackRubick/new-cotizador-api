import request from 'supertest';
import app from '../src/app';

describe('Auth', () => {
  it('rejects wrong credentials', async () => {
    const res = await (request(app as any) as any).post('/api/auth/login').send({ email: 'no@existe', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
