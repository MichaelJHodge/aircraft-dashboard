import { AuditLogger } from './auditLogger';
import { PrismaAuditLogger } from './prismaAuditLogger';

export function createAuditLogger(): AuditLogger {
  return new PrismaAuditLogger();
}
