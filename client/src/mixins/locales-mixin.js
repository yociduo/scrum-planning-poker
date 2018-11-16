import wepy from 'wepy';
import { defaultLang, LANG_KEY } from '@/utils/utils';
import locales from '@/utils/locales';
import T from '@/utils/i18n';

export default class LocalesMixin extends wepy.mixin {
  constructor() {
    super();
    const isWeb = wepy.env === 'web';
    if (isWeb) {
      this.handleWebLocales();
    }
  }

  data = {
    t: {},
    currentPage: ''
  }

  switchLanguage(lang) {
    wepy.setStorageSync(LANG_KEY, lang);
    this.$parent.globalData.lang = lang;
    T.setLocale(lang);
    this.setLocales();
  }

  setLocales() {
    const _ = wepy.T._;
    const pageLocales = _(this.currentPage);
    this.t = pageLocales;
    this.$apply();
  }

  onLoad() {
    const pages = getCurrentPages(); // eslint-disable-line
    const currentPage = pages[(pages.length - 1)];
    this.currentPage = currentPage ? currentPage.route.split('pages/')[1] : 'index';
    this.$apply();
    this.setLocales();
  }

  handleWebLocales() {
    this.currentPage = window.location.hash.split('#!/pages/')[1];
    T.registerLocale(locales);
    T.setLocale(defaultLang);
    const _ = T._;
    const pageLocales = _(this.currentPage);
    this.data.t = Object.assign({}, pageLocales);
  }
}
