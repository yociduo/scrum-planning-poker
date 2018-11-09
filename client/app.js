const io = require('./vendor/socket.io-mp-client/socket.io-mp');
const { apiUrl, socketUrl, socketPath } = require('./config');

App({
  onLaunch(options) {
    wx.login({
      success: ({ code }) => this.globalData.code = code,
    });

    const token = wx.getStorageSync('token');
    this.globalData.token = token;
    this.initSocket();
    if (token) return;

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          this.getUserInfo(res);
        } else {
          // for desktop
          // wx.reLaunch({ url: `./pages/welcome/index?backUrl=${encodeURIComponent(options.path)}` });
          wx.reLaunch({ url: `../welcome/index?backUrl=${encodeURIComponent(options.path)}` });
        }
      }
    });
  },
  onShow() {
    if (this.globalData.socket) {
      this.globalData.socket.connect();
    }

    wx.getClipboardData({
      success: ({ data }) => {
        if (data === 'debug') {
          wx.showModal({
            title: 'Enable Debugging',
            content: 'Enable Debugging',
            confirmColor: '#0678C1',
            success: ({ confirm }) => {
              wx.setClipboardData({ data: '' });
              if (confirm) {
                wx.setEnableDebug({ enableDebug: true });
              }
            }
          });
        } else if (data === 'prod') {
          wx.showModal({
            title: 'Disable Debugging',
            content: 'Disable Debugging',
            confirmColor: '#0678C1',
            success: ({ confirm }) => {
              wx.setClipboardData({ data: '' });
              if (confirm) {
                wx.setEnableDebug({ enableDebug: false });
              }
            }
          });
        } else if (data === 'clear-cache') {
          wx.showModal({
            title: 'Clear Storage',
            content: 'Clear Storage',
            confirmColor: '#0678C1',
            success: ({ confirm }) => {
              wx.setClipboardData({ data: '' });
              if (confirm) {
                wx.clearStorageSync();
                wx.reLaunch({ url: './pages/index/index' });
              }
            }
          })
        }
      }
    });
  },
  onHide() {
    if (this.globalData.socket) {
      this.globalData.socket.disconnect();
    }
  },
  getUserInfo(res, success) {
    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    wx.getUserInfo({
      success: ({ encryptedData, iv }) => {
        const { code } = this.globalData;
        wx.request({
          url: `${apiUrl}/users/wxLogin`,
          method: 'POST',
          data: {
            code, encryptedData, iv
          },
          success: ({ data, statusCode }) => {
            if (statusCode === 200) {
              this.globalData.token = data;
              this.initSocket();
              wx.setStorageSync('token', data);
              success && success();
            }
          }
        });

        // 可以将 res 发送给后台解码出 unionId
        this.globalData.userInfo = res.userInfo

        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(res)
        }
      }
    });
  },
  initSocket() {
    if (this.globalData.token) {
      this.globalData.socket = io(socketUrl, {
        path: socketPath,
        transports: ['websocket'],
        query: 'token=' + this.globalData.token
      });
    }
  },
  globalData: {
    userInfo: null,
    token: null,
    code: null,
    socket: null,
  },
});
