const app = getApp();

Page({
  onLoad({ backUrl }) {
    this.backUrl = backUrl ? decodeURIComponent(backUrl) : 'pages/index/index';
  },
  onGotUserInfo(e) {
    const { encryptedData, iv } = e.detail;
    if (encryptedData && iv) {
      this.login(e.detail);
    } else {
      this.openSetting();
    }
  },
  login(res) {
    app.getUserInfo(res, () => wx.navigateTo({ url: `../../${this.backUrl}` }));
  },
  openSetting() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          this.login(res);
        } else {
          wx.showModal({
            title: 'Sorry',
            content: 'Your profile information is required. Please grant the permission.',
            confirmText: 'OK',
            confirmColor: '#0678C1',
            showCancel: false,
            success: () => {
              this.openSetting();
            }
          });
        }
      }
    });
  }
});
