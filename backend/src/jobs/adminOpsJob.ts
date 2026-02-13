import { UserRole } from '../../../shared/types';
import { config } from '../config';
import { DomainEvent, DomainEventType } from '../events/domainEvents';
import { domainEventDeliveryStore } from '../events/deliveryStore';
import { createEventPublisher } from '../events/publisherFactory';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { z } from 'zod';

const domainEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['aircraft.status.changed', 'certification.milestone.updated']),
  source: z.string().min(1),
  version: z.number().int().positive(),
  occurredAt: z.string().min(1),
  detail: z.unknown(),
  meta: z.object({
    actorId: z.string().min(1),
    actorEmail: z.string().min(1),
    actorRole: z.nativeEnum(UserRole),
  }),
});

type ReplayableEvent = DomainEvent<Record<string, unknown>> & {
  type: DomainEventType;
};

export interface AdminOpsJobOptions {
  dryRun: boolean;
  replayLimit: number;
  maxAttempts: number;
}

interface AdminOpsJobSummary {
  scanned: number;
  replayed: number;
  failed: number;
  invalidPayload: number;
}

export function parseAdminOpsJobOptions(argv: string[]): AdminOpsJobOptions {
  return {
    dryRun: argv.includes('--dry-run'),
    replayLimit: config.adminJobEventReplayLimit,
    maxAttempts: config.adminJobEventReplayMaxAttempts,
  };
}

function parseReplayableEvent(payload: unknown, eventId: string): ReplayableEvent {
  const parsed = domainEventSchema.parse(payload);
  return {
    ...parsed,
    id: eventId,
    detail:
      typeof parsed.detail === 'object' && parsed.detail !== null
        ? (parsed.detail as Record<string, unknown>)
        : {},
  };
}

export async function runAdminOpsJob(
  options: AdminOpsJobOptions
): Promise<AdminOpsJobSummary> {
  const publisher = createEventPublisher();
  const pending = await domainEventDeliveryStore.listPendingDeliveries({
    limit: options.replayLimit,
    maxAttempts: options.maxAttempts,
  });

  const summary: AdminOpsJobSummary = {
    scanned: pending.length,
    replayed: 0,
    failed: 0,
    invalidPayload: 0,
  };

  logger.info(
    {
      mode: options.dryRun ? 'dry-run' : 'replay',
      replayLimit: options.replayLimit,
      maxAttempts: options.maxAttempts,
      pending: pending.length,
    },
    'Admin ops job started'
  );

  for (const delivery of pending) {
    if (options.dryRun) {
      logger.info(
        {
          eventId: delivery.eventId,
          eventType: delivery.eventType,
          attempts: delivery.attempts,
        },
        'Dry-run candidate event'
      );
      continue;
    }

    await domainEventDeliveryStore.markAttempt(delivery.eventId);

    let event: ReplayableEvent;
    try {
      event = parseReplayableEvent(delivery.payload, delivery.eventId);
    } catch (error) {
      await domainEventDeliveryStore.markFailed(delivery.eventId, error);
      summary.invalidPayload += 1;
      summary.failed += 1;
      logger.error(
        {
          err: error,
          eventId: delivery.eventId,
          eventType: delivery.eventType,
        },
        'Admin ops job skipped invalid event payload'
      );
      continue;
    }

    try {
      await publisher.publish(event);
      await domainEventDeliveryStore.markPublished(delivery.eventId);
      summary.replayed += 1;
    } catch (error) {
      await domainEventDeliveryStore.markFailed(delivery.eventId, error);
      summary.failed += 1;
      logger.error(
        {
          err: error,
          eventId: delivery.eventId,
          eventType: delivery.eventType,
        },
        'Admin ops job failed to replay event'
      );
    }
  }

  logger.info({ summary }, 'Admin ops job completed');
  return summary;
}

async function main(): Promise<void> {
  const options = parseAdminOpsJobOptions(process.argv.slice(2));

  try {
    const summary = await runAdminOpsJob(options);
    logger.info({ summary }, 'Admin ops job summary');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    logger.error({ err: error }, 'Admin ops job crashed');
    process.exit(1);
  });
}
