import { Action } from 'routing-controllers';
import { verify } from '../util';

export const authorizationChecker = async (action: Action, roles?: string[]) => {
  // perform queries based on token from request headers
  const token = action.request.headers['authorization'];

  try {
    verify(token);
  } catch {
    return false;
  }

  return true;
};
