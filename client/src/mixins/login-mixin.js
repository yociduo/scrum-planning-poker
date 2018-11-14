import wepy from 'wepy';

export default class LoginMixin extends wepy.mixin {
  async onLoad() {
    if (!this.$parent.globalData.token) {
      this.$redirect('welcome');
      // const res = await wepy.getSetting();
      // if (res.authSetting['scope.userInfo']) {
      //   await this.$parent.login();
      // } else {
      // this.$redirect('welcome');
      // }
    }
  }
}
