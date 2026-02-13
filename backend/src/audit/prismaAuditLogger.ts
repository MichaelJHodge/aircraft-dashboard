import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { userRoleMapper } from '../utils/mappers';
import { AuditLogger, AuditRecord } from './auditLogger';

const actionMap = {
  'certification.milestone.updated': AuditAction.CERTIFICATION_MILESTONE_UPDATED,
} as const;

export class PrismaAuditLogger implements AuditLogger {
  async log(record: AuditRecord): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: actionMap[record.action],
        actorId: record.actorId,
        actorEmail: record.actorEmail,
        actorRole: userRoleMapper.toPrisma(record.actorRole),
        entityType: record.entityType,
        entityId: record.entityId,
        details: record.details as Prisma.InputJsonValue,
      },
    });
  }
}
