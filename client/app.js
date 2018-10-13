const io = require('./vendor/socket.io-mp-client/socket.io-mp');
const { apiUrl, socketUrl } = require('./config');

App({
  onLaunch(options) {
    this.globalData.socket = io(socketUrl, {
      transports: ['websocket'],
    });

    this.globalData.socket.on('connect', () => {
      if (this.globalData.token) {
        this.globalData.socket.emit('login', this.globalData.token);
      }
    });

    const token = wx.getStorageSync('token');
    this.globalData.token = token;
    if (token) return;

    wx.login({
      success: ({ code }) => this.globalData.code = code,
    });

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
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
                    this.globalData.socket.emit('login', this.globalData.token);
                    wx.setStorageSync('token', data);
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
        } else {
          wx.reLaunch({ url: `./pages/welcome/index?backUrl=${encodeURIComponent(options.path)}` });
        }
      }
    });
  },
  onShow() {
    this.globalData.socket.connect();

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
    this.globalData.socket.disconnect();
  },
  globalData: {
    userInfo: null,
    token: null,
    code: null,
    socket: null,
  },
});
