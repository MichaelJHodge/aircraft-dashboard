import crypto from 'node:crypto';
import { AircraftPhase, UserRole } from '../../../shared/types';

export type DomainEventType =
  | 'aircraft.status.changed'
  | 'certification.milestone.updated';

interface DomainEventMeta {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
}

export interface DomainEvent<TDetail = Record<string, unknown>> {
  id: string;
  type: DomainEventType;
  source: string;
  version: number;
  occurredAt: string;
  detail: TDetail;
  meta: DomainEventMeta;
}

export interface AircraftStatusChangedDetail {
  aircraftId: string;
  tailNumber: string;
  previousPhase: AircraftPhase;
  newPhase: AircraftPhase;
  previousEstimatedDeliveryDate?: string;
  newEstimatedDeliveryDate?: string;
}

export interface CertificationMilestoneUpdatedDetail {
  aircraftId: string;
  tailNumber: string;
  milestoneId: string;
  milestoneName: string;
  previousCompleted: boolean;
  newCompleted: boolean;
  previousCertificationProgress: number;
  newCertificationProgress: number;
}

export interface EventMetaInput {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
}

export function createDomainEvent<TDetail>(
  type: DomainEventType,
  source: string,
  detail: TDetail,
  meta: EventMetaInput
): DomainEvent<TDetail> {
  return {
    id: crypto.randomUUID(),
    type,
    source,
    version: 1,
    occurredAt: new Date().toISOString(),
    detail,
    meta,
  };
}
