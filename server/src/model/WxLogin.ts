import { IsNotEmpty } from 'class-validator';

export class WxLogin {

  @IsNotEmpty()
  code: string;

  encryptedData?: string;

  iv?: string;

}
