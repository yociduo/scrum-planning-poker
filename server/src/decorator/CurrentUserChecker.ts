import * as jwt from 'jsonwebtoken';
import { Action } from 'routing-controllers';
import { getManager } from 'typeorm';
import { config } from '../config';
import { User } from '../entity';

export const currentUserChecker = async (action: Action, value?: any) => {
  // perform queries based on token from request headers
  const token = action.request.headers['authorization'];

  try {
    const id = Number(jwt.verify(token.slice(7), config.jwtSecret));
    return await getManager().getRepository(User).findOne(id);
  } catch {
    return null;
  }
};
