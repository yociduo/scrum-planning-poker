import { IsNotEmpty } from 'class-validator';

export class WxLogin {

  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  encryptedData: string;

  @IsNotEmpty()
  iv: string;

}
