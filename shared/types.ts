export enum AircraftPhase {
  MANUFACTURING = 'Manufacturing',
  GROUND_TESTING = 'Ground Testing',
  FLIGHT_TESTING = 'Flight Testing',
  CERTIFICATION = 'Certification',
  READY = 'Ready for Delivery',
  DELIVERED = 'Delivered',
}

export enum AircraftModel {
  ALIA_250 = 'ALIA-250',
  ALIA_250C = 'ALIA-250C',
}

export enum MilestoneStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  UPCOMING = 'upcoming',
}

export enum UserRole {
  INTERNAL = 'internal',
  CUSTOMER = 'customer',
}

export interface CertificationMilestone {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  requiredFor: AircraftPhase;
}

export interface LifecycleStage {
  phase: AircraftPhase;
  status: MilestoneStatus;
  startDate?: string;
  completionDate?: string;
  progressPercentage?: number;
}

export interface SustainabilityMetrics {
  estimatedCO2AvoidedKg: number;
  equivalentTreesPlanted: number;
  conventionalFuelSavedGallons: number;
}

export interface Aircraft {
  id: string;
  tailNumber: string;
  model: AircraftModel;
  currentPhase: AircraftPhase;
  certificationProgress: number;
  estimatedDeliveryDate: string;
  lifecycleStages: LifecycleStage[];
  certificationMilestones: CertificationMilestone[];
  sustainabilityMetrics: SustainabilityMetrics;
  customerName?: string;
  updatedAt: string;
  lastUpdatedByEmail?: string;
}

export interface StatusDistribution {
  phase: AircraftPhase;
  count: number;
}

export interface DashboardSummary {
  totalAircraft: number;
  readyForDelivery: number;
  inCertification: number;
  inTesting: number;
  statusDistribution: StatusDistribution[];
}

export interface AircraftTimeline {
  tailNumber: string;
  currentPhase: AircraftPhase;
  lifecycleStages: LifecycleStage[];
}

export interface AircraftCertifications {
  tailNumber: string;
  certificationProgress: number;
  milestones: CertificationMilestone[];
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

export type SortOrder = 'asc' | 'desc';

export type AircraftSortBy =
  | 'estimatedDeliveryDate'
  | 'tailNumber'
  | 'certificationProgress'
  | 'currentPhase';

export interface AircraftQuery {
  page: number;
  pageSize: number;
  phase?: AircraftPhase;
  model?: AircraftModel;
  search?: string;
  sortBy: AircraftSortBy;
  sortOrder: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAircraftInput {
  tailNumber: string;
  model: AircraftModel;
  currentPhase: AircraftPhase;
  estimatedDeliveryDate: string;
  customerName?: string | null;
}

export interface BulkImportError {
  index: number;
  tailNumber?: string;
  message: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: BulkImportError[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  customerName?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
