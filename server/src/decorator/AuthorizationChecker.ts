import * as jwt from 'jsonwebtoken';
import { Action } from 'routing-controllers';

export const authorizationChecker = async (action: Action, roles?: string[]) => {
  // perform queries based on token from request headers
  const token = action.request.headers['authorization'];

  try {
    jwt.verify(token.slice(7), 'secret');
  } catch {
    return false;
  }

  return true;
};
