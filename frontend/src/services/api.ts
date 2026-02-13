import {
  Aircraft,
  AircraftCertifications,
  AircraftQuery,
  AircraftTimeline,
  BulkImportResult,
  CreateAircraftInput,
  DashboardSummary,
  LoginResponse,
  PaginatedResponse,
} from '../types';
import { httpClient } from './httpClient';

interface AircraftStatusUpdate {
  currentPhase: Aircraft['currentPhase'];
  estimatedDeliveryDate?: string;
  customerName?: string | null;
}

interface MilestoneUpdate {
  completed: boolean;
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<LoginResponse> =>
      httpClient.post('/auth/login', { email, password }),
  },

  dashboard: {
    getSummary: (): Promise<DashboardSummary> => httpClient.get('/dashboard'),
  },

  aircraft: {
    getAll: (query: AircraftQuery): Promise<PaginatedResponse<Aircraft>> => {
      const params = new URLSearchParams();
      params.set('page', String(query.page));
      params.set('pageSize', String(query.pageSize));
      params.set('sortBy', query.sortBy);
      params.set('sortOrder', query.sortOrder);
      if (query.phase) params.set('phase', query.phase);
      if (query.model) params.set('model', query.model);
      if (query.search) params.set('search', query.search);

      return httpClient.get(`/aircraft?${params.toString()}`);
    },

    getById: (id: string): Promise<Aircraft> => httpClient.get(`/aircraft/${id}`),

    getTimeline: (id: string): Promise<AircraftTimeline> =>
      httpClient.get(`/aircraft/${id}/timeline`),

    getCertifications: (id: string): Promise<AircraftCertifications> =>
      httpClient.get(`/aircraft/${id}/certifications`),

    updateStatus: (id: string, payload: AircraftStatusUpdate): Promise<Aircraft> =>
      httpClient.patch(`/aircraft/${id}/status`, payload),

    updateMilestone: (
      id: string,
      milestoneId: string,
      payload: MilestoneUpdate
    ): Promise<Aircraft> => httpClient.patch(`/aircraft/${id}/milestones/${milestoneId}`, payload),

    create: (payload: CreateAircraftInput): Promise<Aircraft> =>
      httpClient.post('/aircraft', payload),

    importBatch: (payload: { aircraft: CreateAircraftInput[] }): Promise<BulkImportResult> =>
      httpClient.post('/aircraft/import', payload),
  },

  health: {
    check: (): Promise<{ status: string; timestamp: string; environment: string }> =>
      httpClient.get('/health'),
    readiness: (): Promise<{ status: string; checks: { database: string } }> =>
      httpClient.get('/readiness'),
  },
};
