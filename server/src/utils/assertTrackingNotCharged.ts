import { CHARGED_TRACKING_EDIT_ERROR } from '../lib/chargedTrackingErrors';

export function assertTrackingNotCharged(existing: {
  wasCharged?: boolean | null;
}): void {
  if (existing.wasCharged === true) {
    throw new Error(CHARGED_TRACKING_EDIT_ERROR);
  }
}
