import type { AuthUser } from './auth';
import type { ListQuery } from '../utils/listQuery';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
      listQuery?: ListQuery;
    }
  }
}

export {};
