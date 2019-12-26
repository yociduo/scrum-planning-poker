import { formatRoomId, formatTimer } from '../Format';

describe('Format', () => {
  it('format room id', () => {
    expect(formatRoomId(1)).toBe('Room 1');
  });

  it('format timer', () => {
    expect(formatTimer(119)).toBe('00:01:59');
  });
});
