// tslint:disable: max-line-length
import { decryptData, sign, verify } from '../User';

describe('User', () => {
  it('decrypt user', () => {
    const data = decryptData(
      'TdAiWhvFge+vCFPUOKLfjfQLjieLahrwJeonG8fve8Jz4crLO/jby5gC+jVBmkjFwzTJmQgoZpJx/4lExXYzn8+rgnaF1AXQVD2gh5q1YuNByxy75/JzFe/u4tZ2YcXi//DTul/bN6T4jGxMGFnklAY5e7BoNg+XLdDgA7G/rwMZR5KHSs4Z6AS7E5cOnxh01E1UsLSZ/fm7dS2JD3tM5IYmAo3VsjRKWtjm6UD2YzVQDvX2XS+6oUaQUrRsLCyyvTMEu9S4mcta7UzTQDTw4RfpCT/Euq2rt7dnbV2lgeoomz8H+BnppETadifdDtNbw69S6CUFytqm4tk7o26i+B/FrUU/itrwUMem7q25jeP6nA50UkCSCNyBtSY+MiXaSDCfbWZGSDqUV1rfBkWIQMbPsFcV++mXFzCmI3B0kH6td5JzXM23+K5tPWBYOL52wLsOI8WtONvRECCDpv06FTmd4xBQ+uzVHR/fhfYQ0bVgevWDt3wGCQC/x4wHhNuQYQFJZb9icqM5t8UwgTcLdFMEUW+/wUsfL8ZoAkz238Q=',
      'o5SDaK9kvCY4vMSOpLFT7g==',
      'fwYGVLt/rjHzEJ1KzSewLw==',
    );

    expect(data).not.toBeNull();
    expect(data.openId).toBe('ont9F43zPDRoyV6LYi_OnkOh4WNY');
  });

  it('jsonwebtoken', () => {
    const token = sign(1, false);
    expect(verify(token)).toBe(1);
    expect(verify(`Bearer ${token}`)).toBe(1);

    const token2 = sign(2);
    expect(verify(token2)).toBe(2);
    expect(verify(`Bearer ${token2}`)).toBe(2);

    const token3 = 'eyJhbGciOiJIUzI1NiJ9.MQ.fGaUARI99DDadCuNm4ZUhaB6Bpx8KiJsnCLTisJ0bp4';
    expect(verify(token3)).toBe(1);
  });
});
