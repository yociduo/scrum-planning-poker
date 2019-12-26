export function formatRoomId(roomId: number): string {
  return `Room ${roomId}`;
}

export function formatTimer(timer: number): string {
  const hour = Math.floor(timer / 3600);
  const minute = Math.floor((timer % 3600) / 60);
  const second = timer % 60;
  return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`;
}

export function formatNumber(n: number): string {
  const ns = n.toString()
  return ns[1] ? ns : '0' + ns;
}
