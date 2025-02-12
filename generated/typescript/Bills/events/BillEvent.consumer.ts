import { BillEvent } from '../models/BillEvent';
import { ObjectSerializer } from '../models/ObjectSerializer';

export const unmarshal = (eventDetail: string): BillEvent => {
  const parsed = ObjectSerializer.parse(eventDetail, 'application/json');
  return ObjectSerializer.deserialize(parsed, 'BillEvent', 'json') as BillEvent;
};