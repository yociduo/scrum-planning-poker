const { apiUrl } = require('../../config');
const app = getApp();

Page({
  onLoad({ backUrl }) {
    this.backUrl = backUrl ? decodeURIComponent(backUrl) : 'pages/index/index';
  },
  onGotUserInfo(e) {
    const { code } = app.globalData;
    const { encryptedData, iv } = e.detail;
    wx.request({
      url: `${apiUrl}/users/wxLogin`,
      method: 'POST',
      data: {
        code, encryptedData, iv
      },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          app.globalData.token = data;
          wx.setStorageSync('token', data);
          wx.navigateTo({ url: `../../${this.backUrl}` });
        }
      },
    });
  }
});
