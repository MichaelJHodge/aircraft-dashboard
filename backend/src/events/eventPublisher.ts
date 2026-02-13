import { DomainEvent } from './domainEvents';

export interface EventPublisher {
  publish<TDetail>(event: DomainEvent<TDetail>): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

export class NoopEventPublisher implements EventPublisher {
  async publish<TDetail>(_event: DomainEvent<TDetail>): Promise<void> {
    return;
  }

  async publishBatch(_events: DomainEvent[]): Promise<void> {
    return;
  }
}
