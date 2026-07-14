import {
  CHARGED_TRACKING_DELETE_ERROR,
  CHARGED_TRACKING_EDIT_ERROR,
} from '../lib/chargedTrackingErrors';

export function assertTrackingNotCharged(
  existing: {
    wasCharged?: boolean | null;
  },
  message: string = CHARGED_TRACKING_EDIT_ERROR,
): void {
  if (existing.wasCharged === true) {
    throw new Error(message);
  }
}

export function assertTrackingNotChargedForDelete(existing: {
  wasCharged?: boolean | null;
}): void {
  assertTrackingNotCharged(existing, CHARGED_TRACKING_DELETE_ERROR);
}
