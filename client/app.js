App({
  onLaunch(options) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: `./pages/welcome/index?backUrl=${encodeURIComponent(options.path)}` });
    }
    this.globalData.token = token;
  },
  onShow() {
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
  globalData: {
    userInfo: null,
    token: null,
  },
});
