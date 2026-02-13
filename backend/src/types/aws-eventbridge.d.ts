declare module '@aws-sdk/client-eventbridge' {
  export interface PutEventsRequestEntry {
    EventBusName?: string;
    Source?: string;
    DetailType?: string;
    Detail?: string;
    Time?: Date;
    Resources?: string[];
  }

  export class PutEventsCommand {
    constructor(input: { Entries: PutEventsRequestEntry[] });
  }

  export class EventBridgeClient {
    constructor(config: { region: string; endpoint?: string });
    send(command: PutEventsCommand): Promise<{
      FailedEntryCount?: number;
      Entries?: Array<{ ErrorCode?: string; ErrorMessage?: string }>;
    }>;
  }
}
