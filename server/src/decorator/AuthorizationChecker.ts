import { Action } from 'routing-controllers';

export const authorizationChecker = async (action: Action, roles?: string[]) => {
  console.log(action);
  return true;
};
