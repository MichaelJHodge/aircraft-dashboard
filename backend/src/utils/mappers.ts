import {
  AircraftModel as PrismaAircraftModel,
  AircraftPhase as PrismaAircraftPhase,
  MilestoneStatus as PrismaMilestoneStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import {
  AircraftModel,
  AircraftPhase,
  MilestoneStatus,
  UserRole,
} from '../../../shared/types';

const phaseToPrismaMap: Record<AircraftPhase, PrismaAircraftPhase> = {
  [AircraftPhase.MANUFACTURING]: PrismaAircraftPhase.MANUFACTURING,
  [AircraftPhase.GROUND_TESTING]: PrismaAircraftPhase.GROUND_TESTING,
  [AircraftPhase.FLIGHT_TESTING]: PrismaAircraftPhase.FLIGHT_TESTING,
  [AircraftPhase.CERTIFICATION]: PrismaAircraftPhase.CERTIFICATION,
  [AircraftPhase.READY]: PrismaAircraftPhase.READY,
  [AircraftPhase.DELIVERED]: PrismaAircraftPhase.DELIVERED,
};

const phaseFromPrismaMap: Record<PrismaAircraftPhase, AircraftPhase> = {
  MANUFACTURING: AircraftPhase.MANUFACTURING,
  GROUND_TESTING: AircraftPhase.GROUND_TESTING,
  FLIGHT_TESTING: AircraftPhase.FLIGHT_TESTING,
  CERTIFICATION: AircraftPhase.CERTIFICATION,
  READY: AircraftPhase.READY,
  DELIVERED: AircraftPhase.DELIVERED,
};

const modelToPrismaMap: Record<AircraftModel, PrismaAircraftModel> = {
  [AircraftModel.ALIA_250]: PrismaAircraftModel.ALIA_250,
  [AircraftModel.ALIA_250C]: PrismaAircraftModel.ALIA_250C,
};

const modelFromPrismaMap: Record<PrismaAircraftModel, AircraftModel> = {
  ALIA_250: AircraftModel.ALIA_250,
  ALIA_250C: AircraftModel.ALIA_250C,
};

const milestoneStatusFromPrismaMap: Record<
  PrismaMilestoneStatus,
  MilestoneStatus
> = {
  COMPLETED: MilestoneStatus.COMPLETED,
  IN_PROGRESS: MilestoneStatus.IN_PROGRESS,
  UPCOMING: MilestoneStatus.UPCOMING,
};

const milestoneStatusToPrismaMap: Record<MilestoneStatus, PrismaMilestoneStatus> = {
  [MilestoneStatus.COMPLETED]: PrismaMilestoneStatus.COMPLETED,
  [MilestoneStatus.IN_PROGRESS]: PrismaMilestoneStatus.IN_PROGRESS,
  [MilestoneStatus.UPCOMING]: PrismaMilestoneStatus.UPCOMING,
};

const userRoleToPrismaMap: Record<UserRole, PrismaUserRole> = {
  [UserRole.INTERNAL]: PrismaUserRole.INTERNAL,
  [UserRole.CUSTOMER]: PrismaUserRole.CUSTOMER,
};

const userRoleFromPrismaMap: Record<PrismaUserRole, UserRole> = {
  INTERNAL: UserRole.INTERNAL,
  CUSTOMER: UserRole.CUSTOMER,
};

export const phaseMapper = {
  toPrisma: (phase: AircraftPhase): PrismaAircraftPhase => phaseToPrismaMap[phase],
  fromPrisma: (phase: PrismaAircraftPhase): AircraftPhase => phaseFromPrismaMap[phase],
};

export const modelMapper = {
  toPrisma: (model: AircraftModel): PrismaAircraftModel => modelToPrismaMap[model],
  fromPrisma: (model: PrismaAircraftModel): AircraftModel => modelFromPrismaMap[model],
};

export const milestoneStatusMapper = {
  toPrisma: (status: MilestoneStatus): PrismaMilestoneStatus =>
    milestoneStatusToPrismaMap[status],
  fromPrisma: (status: PrismaMilestoneStatus): MilestoneStatus =>
    milestoneStatusFromPrismaMap[status],
};

export const userRoleMapper = {
  toPrisma: (role: UserRole): PrismaUserRole => userRoleToPrismaMap[role],
  fromPrisma: (role: PrismaUserRole): UserRole => userRoleFromPrismaMap[role],
};
