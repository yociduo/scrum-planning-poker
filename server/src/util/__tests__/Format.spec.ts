import { formatRoomId, formatTimer, convertScore } from '../Format';

describe('Format', () => {
  it('format room id', () => {
    expect(formatRoomId(1)).toBe('Room 1');
  });

  it('format timer', () => {
    expect(formatTimer(119)).toBe('00:01:59');
  });

  it('convert score', () => {
    expect(convertScore(-1)).toBe('?');
    expect(convertScore(-2)).toBe('C');
    expect(convertScore(1)).toBe('1');
  });
});
