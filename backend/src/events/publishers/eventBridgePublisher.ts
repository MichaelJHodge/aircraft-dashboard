import { logger } from '../../lib/logger';
import { DomainEvent } from '../domainEvents';
import { EventPublisher } from '../eventPublisher';

interface EventBridgePublisherConfig {
  busName: string;
  region: string;
  endpoint?: string;
}

interface EventBridgeEntryResult {
  ErrorCode?: string;
  ErrorMessage?: string;
}

type EventBridgeClientLike = {
  send: (command: unknown) => Promise<{
    FailedEntryCount?: number;
    Entries?: EventBridgeEntryResult[];
  }>;
};

type PutEventsCommandCtor = new (input: { Entries: Record<string, unknown>[] }) => unknown;

async function loadEventBridgeSdk(): Promise<{
  EventBridgeClient: new (config: { region: string; endpoint?: string }) => EventBridgeClientLike;
  PutEventsCommand: PutEventsCommandCtor;
}> {
  return import('@aws-sdk/client-eventbridge') as Promise<{
    EventBridgeClient: new (config: { region: string; endpoint?: string }) => EventBridgeClientLike;
    PutEventsCommand: PutEventsCommandCtor;
  }>;
}

export class EventBridgePublisher implements EventPublisher {
  private clientPromise: Promise<EventBridgeClientLike> | null = null;
  private putEventsCommandCtor: PutEventsCommandCtor | null = null;

  constructor(private readonly config: EventBridgePublisherConfig) {}

  async publish<TDetail>(event: DomainEvent<TDetail>): Promise<void> {
    const client = await this.getClient();
    const PutEventsCommand = await this.getPutEventsCommandCtor();
    const entry = this.toPutEventEntry(event);

    const result = await client.send(
      new PutEventsCommand({
        Entries: [entry],
      })
    );

    const entryResult = result.Entries?.[0];
    if (entryResult?.ErrorCode) {
      throw new Error(
        `EventBridge publish failed (${entryResult.ErrorCode}): ${entryResult.ErrorMessage ?? 'unknown error'}`
      );
    }

    logger.info(
      {
        provider: 'eventbridge',
        region: this.config.region,
        busName: this.config.busName,
        eventId: event.id,
      },
      'EventBridge publish succeeded'
    );
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (!events.length) {
      return;
    }

    const client = await this.getClient();
    const PutEventsCommand = await this.getPutEventsCommandCtor();
    const entries = events.map((event) => this.toPutEventEntry(event));
    const result = await client.send(
      new PutEventsCommand({
        Entries: entries,
      })
    );

    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      throw new Error(`EventBridge batch publish failed for ${result.FailedEntryCount} entries`);
    }
  }

  private async getClient(): Promise<EventBridgeClientLike> {
    if (!this.clientPromise) {
      this.clientPromise = loadEventBridgeSdk().then(({ EventBridgeClient }) =>
        new EventBridgeClient({
          region: this.config.region,
          ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
        })
      );
    }

    return this.clientPromise;
  }

  private async getPutEventsCommandCtor(): Promise<PutEventsCommandCtor> {
    if (!this.putEventsCommandCtor) {
      const sdk = await loadEventBridgeSdk();
      this.putEventsCommandCtor = sdk.PutEventsCommand;
    }

    return this.putEventsCommandCtor;
  }

  private toPutEventEntry<TDetail>(event: DomainEvent<TDetail>): Record<string, unknown> {
    return {
      EventBusName: this.config.busName,
      Source: event.source,
      DetailType: event.type,
      Detail: JSON.stringify({
        id: event.id,
        version: event.version,
        occurredAt: event.occurredAt,
        detail: event.detail,
        meta: event.meta,
      }),
      Time: new Date(event.occurredAt),
      Resources: [`aircraft:${(event.detail as Record<string, unknown>)?.aircraftId ?? 'unknown'}`],
    };
  }
}
