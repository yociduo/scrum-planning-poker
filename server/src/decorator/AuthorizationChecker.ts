import * as jwt from 'jsonwebtoken';
import { Action } from 'routing-controllers';

export const authorizationChecker = async (action: Action, roles?: string[]) => {
  // perform queries based on token from request headers
  // const token = action.request.headers["authorization"];
  // return database.findUserByToken(token).roles.in(roles);
  try {
    const auth = action.request.headers['authorization'];
    const token = auth.slice(7);
    const decoded = jwt.verify(token, 'secret');
    console.log(decoded);
  } catch {
    return false;
  }

  return true;
};
