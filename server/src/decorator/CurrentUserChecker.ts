import { Action } from 'routing-controllers';
import { getManager } from 'typeorm';
import { User } from '../entity';
import { verify } from '../util';

export const currentUserChecker = async (action: Action, value?: any) => {
  // perform queries based on token from request headers
  const token = action.request.headers['authorization'];

  try {
    const id = verify(token);
    return await getManager().getRepository(User).findOne(id);
  } catch {
    return null;
  }
};
