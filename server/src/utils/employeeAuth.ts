import { EMPLOYEE_ROLE_ADMIN } from '../models/Employee';
import type { AuthUser } from '../types/auth';
import { HttpError } from './httpError';

export function prepareEmployeeTrackingBody(
  auth: AuthUser | undefined,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!auth) {
    throw new HttpError(401, 'נדרשת התחברות');
  }

  if (auth.role === EMPLOYEE_ROLE_ADMIN) {
    return body;
  }

  const employeeId = String(body.employee ?? '').trim();
  if (employeeId && employeeId !== auth.employeeId) {
    throw new HttpError(403, 'אין הרשאה');
  }

  const {
    adminOverride: _adminOverride,
    billable: _billable,
    wasCharged: _wasCharged,
    ...rest
  } = body;

  return {
    ...rest,
    employee: auth.employeeId,
  };
}
