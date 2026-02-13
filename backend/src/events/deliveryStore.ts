import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { DomainEvent } from './domainEvents';

export class DomainEventDeliveryStore {
  async ensureDeliveryRecord<TDetail>(
    event: DomainEvent<TDetail>
  ): Promise<{ published: boolean }> {
    const record = await prisma.domainEventDelivery.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        source: event.source,
        attempts: 0,
        published: false,
        payload: event as unknown as Prisma.InputJsonValue,
      },
      update: {},
      select: {
        published: true,
      },
    });

    return record;
  }

  async markAttempt(eventId: string): Promise<void> {
    await prisma.domainEventDelivery.update({
      where: { eventId },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async markPublished(eventId: string): Promise<void> {
    await prisma.domainEventDelivery.update({
      where: { eventId },
      data: {
        published: true,
        lastError: null,
        publishedAt: new Date(),
      },
    });
  }

  async markFailed(eventId: string, error: unknown): Promise<void> {
    await prisma.domainEventDelivery.update({
      where: { eventId },
      data: {
        lastError:
          error instanceof Error
            ? `${error.name}: ${error.message}`.slice(0, 1000)
            : 'Unknown event publish error',
      },
    });
  }

  async listPendingDeliveries(options?: {
    limit?: number;
    maxAttempts?: number;
  }): Promise<
    Array<{
      eventId: string;
      eventType: string;
      attempts: number;
      payload: Prisma.JsonValue;
    }>
  > {
    const limit = options?.limit ?? 50;
    const maxAttempts = options?.maxAttempts ?? 10;

    return prisma.domainEventDelivery.findMany({
      where: {
        published: false,
        attempts: {
          lt: maxAttempts,
        },
      },
      orderBy: [
        {
          createdAt: 'asc',
        },
      ],
      take: limit,
      select: {
        eventId: true,
        eventType: true,
        attempts: true,
        payload: true,
      },
    });
  }
}

export const domainEventDeliveryStore = new DomainEventDeliveryStore();
