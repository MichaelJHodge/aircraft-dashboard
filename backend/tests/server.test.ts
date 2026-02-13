import request from 'supertest';
import app from '../src/server';

describe('health endpoints', () => {
  it('returns health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
    });
  });
});
