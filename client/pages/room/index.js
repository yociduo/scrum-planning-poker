import { calcMethods, cards, formatTimer, initResults } from '../../utils/util';
const app = getApp();

Page({
  data: {
    init: false,
    cards,
    calcMethods,
    results: initResults,
    inviteIconUrl: '../../image/user-plus.png',
    addStoryIconUrl: '../../image/plus.png',
    shareImageUrl: '',
  },
  onLoad(options) {
    this.setData({ id: Number(options.id) });

    app.globalData.socket.on('init', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      if (payload.stories && payload.stories.length) {
        payload.stories = payload.stories.filter(s => s.isCompleted && !s.isDeleted);
      }

      if (payload.currentStory) {
        const title = payload.name;
        wx.setNavigationBarTitle({ title });
        this.setData({ init: true, ...payload });
        this.interval = setInterval(() => {
          const { currentStory } = this.data;
          if (currentStory) {
            currentStory.timer++;
            currentStory.displayTimer = formatTimer(currentStory.timer);
            this.setData({ currentStory });
          } else {
            clearInterval(this.interval);
          }
        }, 1000);

      } else {
        app.globalData.room = payload;
        wx.redirectTo({ url: `../room-detail/index?id=${id}` });
      }
    });

    app.globalData.socket.on('action', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      if (payload.stories && payload.stories.length) {
        payload.stories = payload.stories.filter(s => s.isCompleted && !s.isDeleted);
      }
      // const refresh = {};
      this.setData(payload);

      // if (payload.scores) {
      //   refresh.scores = payload.scores;
      //   refresh.count = payload.count;
      //   refresh.time = payload.time;
      //   refresh.total = payload.total;
      // }

      // if (payload.finished !== null && payload.finished !== undefined) {
      //   refresh.finished = payload.finished;
      // }

      // if (Object.keys(refresh).length > 0) {
      //   const cache = wx.getStorageSync(id) || {};
      //   wx.setStorageSync(id, { ...cache, ...refresh });
      // }

      if (payload.closed) {
        wx.redirectTo({ url: `../room-detail/index?id=${id}` });
      }
    });

    app.globalData.socket.on('error', (content) => wx.showModal({
      title: 'Error',
      content,
      showCancel: false,
      confirmText: 'OK',
      confirmColor: '#0678C1',
      success: () => this.onBackTap(),
    }));
  },
  onUnload() {
    app.globalData.socket.emit('leave room', this.data.id);
    clearInterval(this.interval);
  },
  onShow() {
    app.globalData.socket.emit('join room', this.data.id);
  },
  onHide() {
    app.globalData.socket.emit('leave room', this.data.id);
  },
  onShareAppMessage() {
    return { title: this.data.name, imageUrl: this.data.shareImageUrl };
  },
  onAddTap() {
    wx.navigateTo({ url: `../add-story/index?id=${this.data.id}` });
  },
  onCardTap(e) {
    const { id, selectedCard } = this.data;
    const { card } = e.currentTarget.dataset;
    const value = card.value === selectedCard ? null : card.value;
    this.setData({ selectedCard: value });
    app.globalData.socket.emit('select card', { id, card: value });
  },
  onSaveTap() {
    const { id, loading } = this.data;
    if (loading) return;
    app.globalData.socket.emit('next story', id);
    this.setData({ loading: true });
  },
  onCalcMethodChange(e) {
    const calcMethod = parseInt(e.detail.value);
    app.globalData.socket.emit('calc method', { id: this.data.id, calcMethod });
  },
  // onSubCalcMethodChange(e) {
  //   const subCalcMethod = parseInt(e.detail.value);
  //   this.setData({ subCalcMethod });
  //   app.globalData.socket.emit('calc method', { id: this.data.id, subCalcMethod });
  // },
  onResultChange(e) {
    const currentScore = parseFloat(e.detail.value);
    app.globalData.socket.emit('current score', { id: this.data.id, currentScore });
  },
  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: `../index/index` });
    }
  }
});
