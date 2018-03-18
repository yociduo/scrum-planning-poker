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
  onShow() {
    this.globalData.socket.connect();
  },
  globalData: {
    userInfo: null,
  }
})