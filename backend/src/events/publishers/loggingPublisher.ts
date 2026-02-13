import { logger } from '../../lib/logger';
import { DomainEvent } from '../domainEvents';
import { EventPublisher } from '../eventPublisher';

export class LoggingEventPublisher implements EventPublisher {
  async publish<TDetail>(event: DomainEvent<TDetail>): Promise<void> {
    logger.info({ event }, 'Domain event published');
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
