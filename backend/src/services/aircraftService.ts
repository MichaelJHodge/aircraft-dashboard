import { Prisma } from '@prisma/client';
import {
  Aircraft,
  AircraftCertifications,
  AircraftModel,
  AircraftPhase,
  AircraftQuery,
  AircraftTimeline,
  BulkImportResult,
  CreateAircraftInput,
  DashboardSummary,
  MilestoneStatus,
  PaginatedResponse,
  UserRole,
} from '../../../shared/types';
import crypto from 'node:crypto';
import { createAuditLogger } from '../audit/auditFactory';
import { AuditLogger } from '../audit/auditLogger';
import { config } from '../config';
import {
  isValidPhaseTransition,
  requiredProgressForTransition,
} from '../domain/phaseTransitionPolicy';
import {
  AircraftStatusChangedDetail,
  CertificationMilestoneUpdatedDetail,
  DomainEvent,
  createDomainEvent,
} from '../events/domainEvents';
import { domainEventDeliveryStore } from '../events/deliveryStore';
import { createEventPublisher } from '../events/publisherFactory';
import { EventPublisher } from '../events/eventPublisher';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { milestoneStatusMapper, modelMapper, phaseMapper } from '../utils/mappers';

const aircraftInclude = {
  lifecycleStages: {
    orderBy: {
      order: 'asc',
    },
  },
  certificationMilestones: true,
  sustainabilityMetrics: true,
} as const;

type AircraftRecord = Prisma.AircraftGetPayload<{ include: typeof aircraftInclude }>;
type LifecycleStageRecord = AircraftRecord['lifecycleStages'][number];
type LifecycleStageMutation = {
  phase: ReturnType<typeof phaseMapper.toPrisma>;
  status: ReturnType<typeof milestoneStatusMapper.toPrisma>;
  startDate: Date | null;
  completionDate: Date | null;
  progressPercentage: number | null;
  order: number;
};

export interface ActorContext {
  userId: string;
  email: string;
  role: UserRole;
}

interface ViewerContext {
  role: UserRole;
  customerName?: string;
}

const PHASE_SEQUENCE: AircraftPhase[] = [
  AircraftPhase.MANUFACTURING,
  AircraftPhase.GROUND_TESTING,
  AircraftPhase.FLIGHT_TESTING,
  AircraftPhase.CERTIFICATION,
  AircraftPhase.READY,
  AircraftPhase.DELIVERED,
];

const DEFAULT_PHASE_PROGRESS: Record<AircraftPhase, number> = {
  [AircraftPhase.MANUFACTURING]: 65,
  [AircraftPhase.GROUND_TESTING]: 45,
  [AircraftPhase.FLIGHT_TESTING]: 72,
  [AircraftPhase.CERTIFICATION]: 88,
  [AircraftPhase.READY]: 95,
  [AircraftPhase.DELIVERED]: 100,
};

const STANDARD_MILESTONE_TEMPLATES: Array<{
  name: string;
  description: string;
  requiredFor: AircraftPhase;
}> = [
  {
    name: 'Type Certification Application',
    description: 'Initial application submitted to FAA for type certification',
    requiredFor: AircraftPhase.MANUFACTURING,
  },
  {
    name: 'Certification Basis Established',
    description: 'Agreement on applicable regulations and special conditions',
    requiredFor: AircraftPhase.MANUFACTURING,
  },
  {
    name: 'Compliance Plan Approved',
    description: 'Detailed plan for demonstrating compliance with regulations',
    requiredFor: AircraftPhase.GROUND_TESTING,
  },
  {
    name: 'Ground Test Protocol Approval',
    description: 'Test procedures approved for static, electrical, and systems testing',
    requiredFor: AircraftPhase.GROUND_TESTING,
  },
  {
    name: 'Flight Test Authorization',
    description: 'Special Flight Authorization or Experimental Certificate issued',
    requiredFor: AircraftPhase.FLIGHT_TESTING,
  },
  {
    name: 'Flight Test Program Completion',
    description: 'All required flight test points completed and data submitted',
    requiredFor: AircraftPhase.CERTIFICATION,
  },
  {
    name: 'Production Certificate Application',
    description: 'Application for production approval submitted',
    requiredFor: AircraftPhase.CERTIFICATION,
  },
  {
    name: 'Type Certificate Issued',
    description: 'FAA Type Certificate granted for aircraft design',
    requiredFor: AircraftPhase.READY,
  },
  {
    name: 'Production Certificate Issued',
    description: 'Production Certificate granted for manufacturing',
    requiredFor: AircraftPhase.READY,
  },
  {
    name: 'Standard Airworthiness Certificate',
    description: 'Individual aircraft airworthiness certificate issued',
    requiredFor: AircraftPhase.DELIVERED,
  },
];

const SUSTAINABILITY_BY_MODEL: Record<AircraftModel, Aircraft['sustainabilityMetrics']> = {
  [AircraftModel.ALIA_250]: {
    estimatedCO2AvoidedKg: 95000,
    equivalentTreesPlanted: 4300,
    conventionalFuelSavedGallons: 24000,
  },
  [AircraftModel.ALIA_250C]: {
    estimatedCO2AvoidedKg: 125000,
    equivalentTreesPlanted: 5700,
    conventionalFuelSavedGallons: 32000,
  },
};

function toIsoDate(date?: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}

function toAircraft(record: AircraftRecord): Aircraft {
  if (!record.sustainabilityMetrics) {
    throw new AppError(`Missing sustainability metrics for aircraft ${record.id}`, 500);
  }

  return {
    id: record.id,
    tailNumber: record.tailNumber,
    model: modelMapper.fromPrisma(record.model),
    currentPhase: phaseMapper.fromPrisma(record.currentPhase),
    certificationProgress: record.certificationProgress,
    estimatedDeliveryDate: toIsoDate(record.estimatedDeliveryDate) ?? '',
    customerName: record.customerName ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
    lastUpdatedByEmail: record.lastUpdatedByEmail ?? undefined,
    lifecycleStages: record.lifecycleStages.map((stage) => ({
      phase: phaseMapper.fromPrisma(stage.phase),
      status: milestoneStatusMapper.fromPrisma(stage.status),
      startDate: toIsoDate(stage.startDate),
      completionDate: toIsoDate(stage.completionDate),
      progressPercentage: stage.progressPercentage ?? undefined,
    })),
    certificationMilestones: record.certificationMilestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      completed: milestone.completed,
      completedDate: toIsoDate(milestone.completedDate),
      requiredFor: phaseMapper.fromPrisma(milestone.requiredFor),
    })),
    sustainabilityMetrics: {
      estimatedCO2AvoidedKg: record.sustainabilityMetrics.estimatedCO2AvoidedKg,
      equivalentTreesPlanted: record.sustainabilityMetrics.equivalentTreesPlanted,
      conventionalFuelSavedGallons: record.sustainabilityMetrics.conventionalFuelSavedGallons,
    },
  };
}

function buildViewerWhere(viewer?: ViewerContext): Prisma.AircraftWhereInput {
  if (viewer?.role === UserRole.CUSTOMER) {
    if (!viewer.customerName) {
      return { id: '__no-customer-scope__' };
    }
    return { customerName: viewer.customerName };
  }
  return {};
}

function buildLifecycleStageData(
  phase: AircraftPhase,
  phaseIndex: number,
  activePhaseIndex: number,
  existingStage: LifecycleStageRecord | undefined,
  now: Date
): LifecycleStageMutation {
  if (phaseIndex < activePhaseIndex) {
    return {
      phase: phaseMapper.toPrisma(phase),
      status: milestoneStatusMapper.toPrisma(MilestoneStatus.COMPLETED),
      startDate: existingStage?.startDate ?? now,
      completionDate: existingStage?.completionDate ?? now,
      progressPercentage: 100,
      order: phaseIndex,
    };
  }

  if (phaseIndex === activePhaseIndex) {
    const defaultProgress = DEFAULT_PHASE_PROGRESS[phase];
    const preservedProgress =
      existingStage?.progressPercentage && existingStage.progressPercentage < 100
        ? existingStage.progressPercentage
        : defaultProgress;

    return {
      phase: phaseMapper.toPrisma(phase),
      status: milestoneStatusMapper.toPrisma(MilestoneStatus.IN_PROGRESS),
      startDate: existingStage?.startDate ?? now,
      completionDate: null,
      progressPercentage: preservedProgress,
      order: phaseIndex,
    };
  }

  return {
    phase: phaseMapper.toPrisma(phase),
    status: milestoneStatusMapper.toPrisma(MilestoneStatus.UPCOMING),
    startDate: null,
    completionDate: null,
    progressPercentage: null,
    order: phaseIndex,
  };
}

function getPhaseIndex(phase: AircraftPhase): number {
  return PHASE_SEQUENCE.indexOf(phase);
}

function getPhaseProgress(phase: AircraftPhase): number {
  return DEFAULT_PHASE_PROGRESS[phase] ?? 0;
}

function normalizeTailNumber(input: string): string {
  return input.trim().toUpperCase();
}

export class AircraftService {
  constructor(
    private readonly eventPublisher: EventPublisher = createEventPublisher(),
    private readonly auditLogger: AuditLogger = createAuditLogger()
  ) {}

  async getDashboardSummary(viewer?: ViewerContext): Promise<DashboardSummary> {
    const where = buildViewerWhere(viewer);

    const [totalAircraft, readyForDelivery, inCertification, inTesting, distribution] =
      await Promise.all([
        prisma.aircraft.count({ where }),
        prisma.aircraft.count({
          where: {
            ...where,
            currentPhase: 'READY',
          },
        }),
        prisma.aircraft.count({
          where: {
            ...where,
            currentPhase: 'CERTIFICATION',
          },
        }),
        prisma.aircraft.count({
          where: {
            ...where,
            currentPhase: {
              in: ['GROUND_TESTING', 'FLIGHT_TESTING'],
            },
          },
        }),
        prisma.aircraft.groupBy({
          by: ['currentPhase'],
          where,
          _count: {
            currentPhase: true,
          },
          orderBy: {
            _count: {
              currentPhase: 'desc',
            },
          },
        }),
      ]);

    return {
      totalAircraft,
      readyForDelivery,
      inCertification,
      inTesting,
      statusDistribution: distribution.map((item) => ({
        phase: phaseMapper.fromPrisma(item.currentPhase),
        count: item._count.currentPhase,
      })),
    };
  }

  async getAllAircraft(
    query: AircraftQuery,
    viewer?: ViewerContext
  ): Promise<PaginatedResponse<Aircraft>> {
    const where: Prisma.AircraftWhereInput = {
      ...buildViewerWhere(viewer),
      ...(query.phase ? { currentPhase: phaseMapper.toPrisma(query.phase) } : {}),
      ...(query.model ? { model: modelMapper.toPrisma(query.model) } : {}),
      ...(query.search
        ? {
            OR: [
              { tailNumber: { contains: query.search, mode: 'insensitive' } },
              { customerName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderByMap: Record<
      AircraftQuery['sortBy'],
      Prisma.AircraftOrderByWithRelationInput
    > = {
      estimatedDeliveryDate: { estimatedDeliveryDate: query.sortOrder },
      tailNumber: { tailNumber: query.sortOrder },
      certificationProgress: { certificationProgress: query.sortOrder },
      currentPhase: { currentPhase: query.sortOrder },
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, records] = await Promise.all([
      prisma.aircraft.count({ where }),
      prisma.aircraft.findMany({
        where,
        include: aircraftInclude,
        orderBy: orderByMap[query.sortBy],
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      data: records.map(toAircraft),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async getAircraftById(id: string, viewer?: ViewerContext): Promise<Aircraft> {
    const record = await prisma.aircraft.findFirst({
      where: {
        id,
        ...buildViewerWhere(viewer),
      },
      include: aircraftInclude,
    });

    if (!record) {
      throw new AppError('Aircraft not found', 404);
    }

    return toAircraft(record);
  }

  async getAircraftTimeline(id: string, viewer?: ViewerContext): Promise<AircraftTimeline> {
    const aircraft = await this.getAircraftById(id, viewer);

    return {
      tailNumber: aircraft.tailNumber,
      currentPhase: aircraft.currentPhase,
      lifecycleStages: aircraft.lifecycleStages,
    };
  }

  async getAircraftCertifications(
    id: string,
    viewer?: ViewerContext
  ): Promise<AircraftCertifications> {
    const aircraft = await this.getAircraftById(id, viewer);
    const completed = aircraft.certificationMilestones.filter((m) => m.completed).length;
    const pending = aircraft.certificationMilestones.length - completed;

    return {
      tailNumber: aircraft.tailNumber,
      certificationProgress: aircraft.certificationProgress,
      milestones: aircraft.certificationMilestones,
      summary: {
        total: aircraft.certificationMilestones.length,
        completed,
        pending,
      },
    };
  }

  async updateAircraftStatus(
    id: string,
    updates: {
      currentPhase: AircraftPhase;
      estimatedDeliveryDate?: string;
      customerName?: string | null;
    },
    actor: ActorContext
  ): Promise<Aircraft> {
    const existing = await prisma.aircraft.findUnique({
      where: { id },
      include: aircraftInclude,
    });

    if (!existing) {
      throw new AppError('Aircraft not found', 404);
    }

    const previousPhase = phaseMapper.fromPrisma(existing.currentPhase);
    if (!isValidPhaseTransition(previousPhase, updates.currentPhase)) {
      throw new AppError(
        `Invalid phase transition from ${previousPhase} to ${updates.currentPhase}.`,
        400
      );
    }

    const requiredProgress = requiredProgressForTransition(previousPhase);
    if (
      updates.currentPhase !== previousPhase &&
      existing.certificationProgress < requiredProgress
    ) {
      throw new AppError(
        `Cannot advance to ${updates.currentPhase} until certification progress reaches ${requiredProgress}%.`,
        400
      );
    }

    const nextPhaseIndex = PHASE_SEQUENCE.indexOf(updates.currentPhase);
    const previousEstimatedDeliveryDate = toIsoDate(existing.estimatedDeliveryDate);
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      for (const [index, phase] of PHASE_SEQUENCE.entries()) {
        const existingStage = existing.lifecycleStages.find(
          (stage) => phaseMapper.fromPrisma(stage.phase) === phase
        );

        const nextStageData = buildLifecycleStageData(
          phase,
          index,
          nextPhaseIndex,
          existingStage,
          now
        );

        if (existingStage) {
          await tx.lifecycleStage.update({
            where: { id: existingStage.id },
            data: {
              status: nextStageData.status,
              startDate: nextStageData.startDate,
              completionDate: nextStageData.completionDate,
              progressPercentage: nextStageData.progressPercentage,
              order: nextStageData.order,
            },
          });
        } else {
          await tx.lifecycleStage.create({
            data: {
              ...nextStageData,
              aircraftId: id,
            },
          });
        }
      }

      return tx.aircraft.update({
        where: { id },
        data: {
          currentPhase: phaseMapper.toPrisma(updates.currentPhase),
          ...(updates.estimatedDeliveryDate
            ? {
                estimatedDeliveryDate: new Date(updates.estimatedDeliveryDate),
              }
            : {}),
          ...(updates.customerName !== undefined
            ? { customerName: updates.customerName }
            : {}),
          lastUpdatedByEmail: actor.email,
        },
        include: aircraftInclude,
      });
    });

    const response = toAircraft(updated);

    if (response.currentPhase !== previousPhase) {
      const detail: AircraftStatusChangedDetail = {
        aircraftId: response.id,
        tailNumber: response.tailNumber,
        previousPhase,
        newPhase: response.currentPhase,
        previousEstimatedDeliveryDate,
        newEstimatedDeliveryDate: response.estimatedDeliveryDate,
      };

      const event = createDomainEvent(
        'aircraft.status.changed',
        config.eventSource,
        detail,
        {
          actorId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
        }
      );

      await this.publishSafely(event);
    }

    return response;
  }

  async updateMilestoneCompletion(
    id: string,
    milestoneId: string,
    completed: boolean,
    actor: ActorContext
  ): Promise<Aircraft> {
    const aircraft = await prisma.aircraft.findUnique({
      where: { id },
      include: {
        certificationMilestones: true,
      },
    });

    if (!aircraft) {
      throw new AppError('Aircraft not found', 404);
    }

    const milestone = aircraft.certificationMilestones.find((item) => item.id === milestoneId);

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const previousCompleted = milestone.completed;
    const previousProgress = aircraft.certificationProgress;

    await prisma.certificationMilestone.update({
      where: { id: milestoneId },
      data: {
        completed,
        completedDate: completed ? new Date() : null,
      },
    });

    const milestones = await prisma.certificationMilestone.findMany({
      where: { aircraftId: id },
      select: { completed: true },
    });

    const completedCount = milestones.filter((item) => item.completed).length;
    const certificationProgress = Math.round((completedCount / milestones.length) * 100);

    const updated = await prisma.aircraft.update({
      where: { id },
      data: {
        certificationProgress,
        lastUpdatedByEmail: actor.email,
      },
      include: aircraftInclude,
    });

    const response = toAircraft(updated);

    const detail: CertificationMilestoneUpdatedDetail = {
      aircraftId: response.id,
      tailNumber: response.tailNumber,
      milestoneId,
      milestoneName: milestone.name,
      previousCompleted,
      newCompleted: completed,
      previousCertificationProgress: previousProgress,
      newCertificationProgress: response.certificationProgress,
    };

    await this.auditLogger.log({
      action: 'certification.milestone.updated',
      actorId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.role,
      entityType: 'aircraft',
      entityId: response.id,
      details: detail,
    });

    const event = createDomainEvent(
      'certification.milestone.updated',
      config.eventSource,
      detail,
      {
        actorId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
      }
    );

    await this.publishSafely(event);

    return response;
  }

  async createAircraft(input: CreateAircraftInput, actor: ActorContext): Promise<Aircraft> {
    const aircraftId = `ac-${crypto.randomUUID()}`;
    const now = new Date();
    const phaseIndex = getPhaseIndex(input.currentPhase);

    try {
      const created = await prisma.$transaction(async (tx) => {
        return tx.aircraft.create({
          data: {
            id: aircraftId,
            tailNumber: normalizeTailNumber(input.tailNumber),
            model: modelMapper.toPrisma(input.model),
            currentPhase: phaseMapper.toPrisma(input.currentPhase),
            certificationProgress: getPhaseProgress(input.currentPhase),
            estimatedDeliveryDate: new Date(input.estimatedDeliveryDate),
            customerName: input.customerName ?? null,
            lastUpdatedByEmail: actor.email,
            lifecycleStages: {
              create: PHASE_SEQUENCE.map((phase, index) =>
                buildLifecycleStageData(phase, index, phaseIndex, undefined, now)
              ),
            },
            certificationMilestones: {
              create: STANDARD_MILESTONE_TEMPLATES.map((template, index) => ({
                id: `${aircraftId}-cert-${index + 1}`,
                name: template.name,
                description: template.description,
                requiredFor: phaseMapper.toPrisma(template.requiredFor),
                completed: getPhaseIndex(template.requiredFor) < phaseIndex,
                completedDate:
                  getPhaseIndex(template.requiredFor) < phaseIndex ? now : null,
              })),
            },
            sustainabilityMetrics: {
              create: SUSTAINABILITY_BY_MODEL[input.model],
            },
          },
          include: aircraftInclude,
        });
      });

      return toAircraft(created);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const message = this.mapCreateAircraftError(error);
      if (message) {
        throw new AppError(message, 409);
      }
      throw error;
    }
  }

  async importAircraft(
    inputs: CreateAircraftInput[],
    actor: ActorContext
  ): Promise<BulkImportResult> {
    const errors: BulkImportResult['errors'] = [];
    let created = 0;

    for (const [index, input] of inputs.entries()) {
      try {
        await this.createAircraft(input, actor);
        created += 1;
      } catch (error) {
        const message =
          this.mapCreateAircraftError(error) ?? 'Failed to create aircraft';
        errors.push({
          index: index + 1,
          tailNumber: input.tailNumber,
          message,
        });
      }
    }

    return {
      total: inputs.length,
      created,
      failed: errors.length,
      errors,
    };
  }

  private mapCreateAircraftError(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return 'Tail number already exists';
    }

    if (error instanceof AppError) {
      return error.message;
    }

    return null;
  }

  private async publishSafely<TDetail>(event: DomainEvent<TDetail>): Promise<void> {
    const { published } = await domainEventDeliveryStore.ensureDeliveryRecord(event);

    if (published) {
      logger.info({ eventId: event.id, eventType: event.type }, 'Skipping duplicate domain event');
      return;
    }

    await domainEventDeliveryStore.markAttempt(event.id);

    try {
      await this.eventPublisher.publish(event);
      await domainEventDeliveryStore.markPublished(event.id);
    } catch (error) {
      await domainEventDeliveryStore.markFailed(event.id, error);
      logger.error({ err: error, eventType: event.type, eventId: event.id }, 'Event publish failed');
    }
  }

}

export const aircraftService = new AircraftService();
