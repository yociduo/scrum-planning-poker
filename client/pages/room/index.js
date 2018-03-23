const app = getApp();

Page({
  data: {
    resultType: 0,
    newStories: '',
    hasNewStories: false,
  },
  onLoad: function (options) {
    const { id } = options;
    const isHost = (wx.getStorageSync('hosted') || []).includes(id);
    this.setData({ id, isHost });

    wx.getUserInfo({
      success: ({ userInfo }) => app.globalData.socket.emit('join room', { id, userInfo, isHost })
    });

    app.globalData.socket.on('connect', () => {
      console.log('system', 'onconnect');
      wx.getUserInfo({
        success: ({ userInfo }) => app.globalData.socket.emit('join room', { id, userInfo, isHost })
      });
    });

    app.globalData.socket.on('init', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      console.log('system', 'oninit');
      if (payload.finished) {
        const cache = wx.getStorageSync(id);
        if (cache) {
          const title = cache.name;
          wx.setNavigationBarTitle({ title });
          this.setData({ ...payload, ...cache });
        } else {
          wx.showModal({
            title: 'Error',
            content: 'Room has been deleted!',
            showCancel: false,
            confirmText: 'OK',
            success: () => this.onClose(),
          });
        }
      } else {
        const title = payload.name;
        wx.setNavigationBarTitle({ title });
        this.setData(payload);
        if (isHost && !payload.start) {
          app.globalData.socket.emit('next story', { id });
        }
        wx.setStorageSync(id, { name: payload.name, scores: payload.scores });
      }
    });

    app.globalData.socket.on('action', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      this.setData(payload);
      if (payload.scores) {
        const cache = wx.getStorageSync(id) || {};
        cache.scores = payload.scores;
        wx.setStorageSync(id, cache);
      }
    });

    app.globalData.socket.on('error', (content) => wx.showModal({
      title: 'Error',
      content,
      showCancel: false,
      confirmText: 'OK',
      success: () => this.onClose(),
    }));
  },
  
  onShareAppMessage: function () {
    return { title: this.data.name, imageUrl: this.data.shareImageUrl };
  },
  onCardClick: function (e) {
    const { id, start, selectedCard } = this.data;
    if (this.data.start) {
      const { card } = e.target.dataset;
      const isSelected = card.value === selectedCard;
      this.setData({ selectedCard: isSelected ? null : card.value });
      app.globalData.socket.emit('select card', { id, card: isSelected ? null : card });
    }
  },
  onSaveAndNext: function () {
    const { id, loading, resultType } = this.data;
    if (loading) return;
    app.globalData.socket.emit('next story', { id, resultType });
    this.setData({ loading: true });
  },
  onSaveAndFinish: function () {
    const { id, loading, resultType, newStories } = this.data;
    if (loading) return;
    const stories = encodeURIComponent(newStories);
    app.globalData.socket.emit('next story', { id, resultType, stories });
    this.setData({ loading: true, newStories: '', hasNewStories: false });
  },
  onCalcMethodChange: function (e) {
    const calcMethod = e.detail.value;
    this.setData({ calcMethod });
    app.globalData.socket.emit('calc method', { id: this.data.id, calcMethod });
  },
  onResultTypeChange: function (e) {
    this.setData({ resultType: e.detail.value });
  },
  onNewStoriesChange: function (e) {
    const newStories = e.detail.value;
    this.setData({
      newStories,
      hasNewStories: newStories && newStories.trim().split('\n').filter(i => i).length > 0
    });
  },
  onClose: function () {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: `../index/index` });
    }
  }
});
