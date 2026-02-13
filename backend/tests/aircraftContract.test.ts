import request from 'supertest';
import app from '../src/server';
import { aircraftController } from '../src/controllers/aircraftController';
import { signToken } from '../src/utils/auth';
import { UserRole } from '../../shared/types';

function createAuthHeader(role: UserRole): string {
  const token = signToken({
    sub: `${role}-test-user`,
    email: `${role}@test.local`,
    role,
  });

  return `Bearer ${token}`;
}

describe('aircraft API contract', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/aircraft/import', () => {
    it('rejects customer role with 403', async () => {
      const response = await request(app)
        .post('/api/aircraft/import')
        .set('Authorization', createAuthHeader(UserRole.CUSTOMER))
        .send({
          aircraft: [
            {
              tailNumber: 'N900BA',
              model: 'ALIA-250',
              currentPhase: 'Manufacturing',
              estimatedDeliveryDate: '2026-12-01',
            },
          ],
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Forbidden');
    });

    it('rejects invalid payload with 400 and validation details', async () => {
      const response = await request(app)
        .post('/api/aircraft/import')
        .set('Authorization', createAuthHeader(UserRole.INTERNAL))
        .send({
          aircraft: [
            {
              tailNumber: 'N901BA',
              model: 'INVALID-MODEL',
              currentPhase: 'Manufacturing',
              estimatedDeliveryDate: '2026-12-01',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Request validation failed');
    });

    it('accepts valid payload for internal users', async () => {
      const importSpy = jest
        .spyOn(aircraftController, 'importAircraft')
        .mockImplementation(async (_req, res) => {
          res.status(201).json({
            total: 1,
            created: 1,
            failed: 0,
            errors: [],
          });
        });

      const response = await request(app)
        .post('/api/aircraft/import')
        .set('Authorization', createAuthHeader(UserRole.INTERNAL))
        .send({
          aircraft: [
            {
              tailNumber: 'N902BA',
              model: 'ALIA-250',
              currentPhase: 'Manufacturing',
              estimatedDeliveryDate: '2026-12-01',
              customerName: 'Bristow',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        total: 1,
        created: 1,
        failed: 0,
        errors: [],
      });
      expect(importSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/aircraft/:id/status', () => {
    it('rejects invalid status payload with 400', async () => {
      const response = await request(app)
        .patch('/api/aircraft/aircraft-1/status')
        .set('Authorization', createAuthHeader(UserRole.INTERNAL))
        .send({
          currentPhase: 'Unknown Phase',
          estimatedDeliveryDate: '2026-12-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('accepts valid status update payload for internal users', async () => {
      const statusSpy = jest
        .spyOn(aircraftController, 'updateAircraftStatus')
        .mockImplementation(async (_req, res) => {
          res.json({
            id: 'aircraft-1',
            tailNumber: 'N250BA',
            currentPhase: 'Certification',
            certificationProgress: 88,
            estimatedDeliveryDate: '2026-12-15',
          });
        });

      const response = await request(app)
        .patch('/api/aircraft/aircraft-1/status')
        .set('Authorization', createAuthHeader(UserRole.INTERNAL))
        .send({
          currentPhase: 'Certification',
          estimatedDeliveryDate: '2026-12-15',
          customerName: 'UPS Flight Forward',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 'aircraft-1',
        currentPhase: 'Certification',
        estimatedDeliveryDate: '2026-12-15',
      });
      expect(statusSpy).toHaveBeenCalledTimes(1);
    });
  });
});
