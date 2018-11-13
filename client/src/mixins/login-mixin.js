import wepy from 'wepy';

export default class LoginMixin extends wepy.mixin {
  onLoad() {
    if (!this.$parent.globalData.token) {
      this.$redirect('welcome');
    }
  }
}
