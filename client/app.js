import io from './vendor/wxsocket.io/index';
const socketUrl = require('./config').socketUrl;

App({
  onLaunch() {

    // login
    wx.login({});

    // connect socket
    const socket = io(socketUrl);
    this.globalData.socket = socket;
  },
  globalData: {
    userInfo: null,
  }
})