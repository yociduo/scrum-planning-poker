import { Action } from 'routing-controllers';
import { User } from '../entity';

export const currentUserChecker = async (action: Action, value?: any) => {
  // perform queries based on token from request headers
  // const token = action.request.headers["authorization"];
  // return database.findUserByToken(token);
  return new User();
};
