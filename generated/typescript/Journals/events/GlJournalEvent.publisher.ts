import { EventBridge, PutEventsCommandOutput } from '@aws-sdk/client-eventbridge';
import { GlJournalEvent } from '../models/GlJournalEvent';
import { ObjectSerializer } from '../models/ObjectSerializer';

export class GlJournalEventPublisher {
  constructor(
    private eventBridge: EventBridge,
    private eventBusName: string
  ) {}

  async publish(event: GlJournalEvent, source: string): Promise<PutEventsCommandOutput> {
    const serialized = ObjectSerializer.serialize(event, 'GlJournalEvent', 'json');
    
    return await this.eventBridge.putEvents({
      Entries: [
        {
          EventBusName: this.eventBusName,
          Source: source,
          DetailType: 'GlJournalEvent',
          Detail: ObjectSerializer.stringify(serialized, 'application/json')
        }
      ]
    });
  }
}