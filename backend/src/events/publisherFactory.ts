import { config } from '../config';
import { EventPublisher, NoopEventPublisher } from './eventPublisher';
import { EventBridgePublisher } from './publishers/eventBridgePublisher';
import { LoggingEventPublisher } from './publishers/loggingPublisher';

export function createEventPublisher(): EventPublisher {
  switch (config.eventPublisher) {
    case 'eventbridge':
      return new EventBridgePublisher({
        busName: config.eventBridgeBusName,
        region: config.awsRegion,
        endpoint: config.awsEventBridgeEndpoint || undefined,
      });
    case 'log':
      return new LoggingEventPublisher();
    default:
      return new NoopEventPublisher();
  }
}
