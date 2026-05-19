import { Types } from 'mongoose';

export function toObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.map((id) => new Types.ObjectId(id));
}
