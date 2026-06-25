import {
  EMPLOYEE_ROLE_EMPLOYEE,
  type EmployeeRole,
} from '../models/Employee';
import { employeeRepository } from '../repositories/employeeRepository';
import type { AuthUser } from '../types/auth';
import { HttpError } from '../utils/httpError';
import { signAuthToken } from '../utils/jwt';
import { normalizeMobile } from '../utils/mobileFormat';

const INVALID_LOGIN_MESSAGE = 'פרטי התחברות שגויים';

function phonesMatch(entered: string, stored: string): boolean {
  const storedTrimmed = stored.trim();
  if (!storedTrimmed) return false;

  try {
    return normalizeMobile(entered) === normalizeMobile(storedTrimmed);
  } catch {
    return false;
  }
}

function toAuthUser(employee: {
  _id: unknown;
  name: string;
  role?: EmployeeRole;
}): AuthUser {
  return {
    employeeId: String(employee._id),
    name: employee.name,
    role: employee.role ?? EMPLOYEE_ROLE_EMPLOYEE,
  };
}

export const authService = {
  async listLoginOptions() {
    const rows = await employeeRepository.findAll();
    return rows.map((row) => ({
      _id: String(row._id),
      name: row.name,
    }));
  },

  async login(employeeId: string, mobile: string) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new HttpError(401, INVALID_LOGIN_MESSAGE);
    }

    const storedMobile = String(employee.mobile ?? '').trim();
    if (!storedMobile) {
      throw new HttpError(401, INVALID_LOGIN_MESSAGE);
    }

    const mobileTrimmed = mobile.trim();
    if (!mobileTrimmed) {
      throw new HttpError(401, INVALID_LOGIN_MESSAGE);
    }

    try {
      normalizeMobile(mobileTrimmed);
    } catch {
      throw new HttpError(401, INVALID_LOGIN_MESSAGE);
    }

    if (!phonesMatch(mobileTrimmed, storedMobile)) {
      throw new HttpError(401, INVALID_LOGIN_MESSAGE);
    }

    const user = toAuthUser(employee);
    const token = signAuthToken(user);

    return {
      token,
      employee: {
        _id: user.employeeId,
        name: user.name,
        role: user.role,
      },
    };
  },

  getCurrentUser(user: AuthUser) {
    return {
      _id: user.employeeId,
      name: user.name,
      role: user.role,
    };
  },
};
