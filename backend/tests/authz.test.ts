import request from 'supertest';
import app from '../src/server';

describe('protected routes', () => {
  it('rejects unauthenticated access to dashboard', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Authorization');
  });
});
