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
    wx.getClipboardData({
      success: ({ data }) => {
        if (data === 'debug') {
          wx.showModal({
            title: 'Enable Debugging',
            content: 'Enable Debugging',
            success: () => {
              wx.setClipboardData({ data: '' });
              wx.setEnableDebug({ enableDebug: true });
            }
          });
        } else if (data === 'prod') {
          wx.showModal({
            title: 'Disable Debugging',
            content: 'Disable Debugging',
            success: () => {
              wx.setClipboardData({ data: '' });
              wx.setEnableDebug({ enableDebug: false });
            }
          });
        } else if (data === 'clear-cache') {
          wx.showModal({
            title: 'Clear Storage',
            content: 'Clear Storage',
            success: () => {
              wx.setClipboardData({ data: '' });
              wx.clearStorageSync();
              wx.reLaunch({ url: 'index' });
            }
          })
        }
      }
    })

    this.globalData.socket.connect();
  },
  globalData: {
    userInfo: null
  }
})