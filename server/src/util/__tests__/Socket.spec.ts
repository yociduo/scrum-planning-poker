import { formatRoomId } from '../Socket';

describe('Socket', () => {
  it('format room id', () => {
    expect(formatRoomId(1)).toBe('Room 1');
  });
});
