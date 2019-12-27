import { md } from 'node-forge';
import { config } from '../config';

export function checkSignature(signature: string, timestamp: string, nonce: string): boolean {
  const sha1 = md.sha1.create();
  sha1.update([config.jwtSecret, timestamp, nonce].sort().join(''));
  return sha1.digest().toHex() === signature;
}
