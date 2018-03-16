const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatTimer = timer => {
  const hour = Math.floor(timer / 3600);
  const minute = Math.floor((timer % 3600) / 60);
  const second = timer % 60;
  return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`
}

module.exports = {
  formatTime,
  formatTimer
}
