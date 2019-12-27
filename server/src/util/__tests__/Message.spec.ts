import { checkSignature } from '../Message';

describe('Message', () => {
  it('check signature should', () => {
    expect(checkSignature('81648a8df2bc8edf36a2e66413e367067f04d1a8', '1577424752', '329580489')).toBeTruthy;
    expect(checkSignature('81648a8df2bc8edf36a2e66413e367067f04d1a8', '1577424752', 'test')).toBeFalsy;
  });
});
