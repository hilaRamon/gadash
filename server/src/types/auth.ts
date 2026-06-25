import type { EmployeeRole } from '../models/Employee';

export type AuthUser = {
  employeeId: string;
  name: string;
  role: EmployeeRole;
};

export type JwtPayload = {
  sub: string;
  name: string;
  role: EmployeeRole;
  iat: number;
  exp: number;
};
