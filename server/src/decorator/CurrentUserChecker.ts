import * as jwt from 'jsonwebtoken';
import { Action } from 'routing-controllers';
import { User } from '../entity';

export const currentUserChecker = async (action: Action, value?: any) => {
  // perform queries based on token from request headers
  // const token = action.request.headers["authorization"];
  // return database.findUserByToken(token);
  // const auth = action.request.headers['authorization'];
  // const token = auth.slice(7);
  // const decoded = jwt.verify(token, 'secret');
  // console.log(decoded);

  // // return database.findUserByToken(token);
  // const user = new User();
  // user.id = decoded.id;
  // user.name = "fdasfa";

  // return user;
  return new User();
};
