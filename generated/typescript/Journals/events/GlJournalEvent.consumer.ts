import { GlJournalEvent } from '../models/GlJournalEvent';
import { ObjectSerializer } from '../models/ObjectSerializer';

export const unmarshal = (eventDetail: string): GlJournalEvent => {
  const parsed = ObjectSerializer.parse(eventDetail, 'application/json');
  return ObjectSerializer.deserialize(parsed, 'GlJournalEvent', 'json') as GlJournalEvent;
};