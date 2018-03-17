const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
};

const formatTimer = timer => {
  const hour = Math.floor(timer / 3600);
  const minute = Math.floor((timer % 3600) / 60);
  const second = timer % 60;
  return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`
};

module.exports = {
  formatNumber,
  formatTimer,
};
