import { UserRole } from '../../../shared/types';

export type AuditAction = 'certification.milestone.updated';

export interface AuditRecord {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  entityType: 'aircraft';
  entityId: string;
  details: unknown;
}

export interface AuditLogger {
  log(record: AuditRecord): Promise<void>;
}
