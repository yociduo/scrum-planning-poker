const host = '://localhost:3000/api';
// const host = 's://www.peajs.top';

const config = {
  host,
  socketUrl: `ws${host}`,
  apiUrl: `http${host}`,
};

module.exports = config;
