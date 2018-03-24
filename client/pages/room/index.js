const app = getApp();

Page({
  onLoad(options) {
    const { id } = options;
    const isHost = (wx.getStorageSync('hosted') || []).includes(id);
    this.setData({ id, isHost });

    wx.getUserInfo({
      success: ({ userInfo }) => app.globalData.socket.emit('join room', { id, userInfo, isHost })
    });

    app.globalData.socket.on('connect', () => {
      wx.getUserInfo({
        success: ({ userInfo }) => app.globalData.socket.emit('join room', { id, userInfo, isHost })
      });
    });

    app.globalData.socket.on('init', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      if (!payload.finished) {
        const title = payload.name;
        wx.setNavigationBarTitle({ title });
        this.setData(payload);
        if (isHost && !payload.start) {
          app.globalData.socket.emit('next story', { id });
        }
        wx.setStorageSync(id, {
          name: payload.name,
          scores: payload.scores,
          count: payload.count,
          time: payload.time,
          total: payload.total
        });
      } else if (!payload.closed) {
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
            success: () => this.onBackTap(),
          });
        }
      } else {
        wx.redirectTo({ url: `../room-detail/index?id=${id}` });
      }
    });

    app.globalData.socket.on('action', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      this.setData(payload);
      if (payload.scores) {
        const cache = wx.getStorageSync(id) || {};
        cache.scores = payload.scores;
        cache.count = payload.count;
        cache.time = payload.time;
        cache.total = payload.total;
        wx.setStorageSync(id, cache);
      }

      if (payload.closed) {
        wx.redirectTo({ url: `../room-detail/index?id=${id}` });
      }
    });

    app.globalData.socket.on('error', (content) => wx.showModal({
      title: 'Error',
      content,
      showCancel: false,
      confirmText: 'OK',
      success: () => this.onBackTap(),
    }));
  },
  onShareAppMessage() {
    return { title: this.data.name, imageUrl: this.data.shareImageUrl };
  },
  onAddTap() {
    wx.navigateTo({ url: `../add-story/index?id=${this.data.id}` });
  },
  onCardTap(e) {
    const { id, start, selectedCard } = this.data;
    if (this.data.start) {
      const { card } = e.currentTarget.dataset;
      const isSelected = card.value === selectedCard;
      this.setData({ selectedCard: isSelected ? null : card.value });
      app.globalData.socket.emit('select card', { id, card: isSelected ? null : card });
    }
  },
  onSaveTap() {
    const { id, loading, resultType } = this.data;
    if (loading) return;
    app.globalData.socket.emit('next story', { id });
    this.setData({ loading: true });
  },
  onCalcMethodChange(e) {
    const calcMethod = parseInt(e.detail.value);
    this.setData({ calcMethod });
    app.globalData.socket.emit('calc method', { id: this.data.id, calcMethod });
  },
  onSubCalcMethodChange(e) {
    const subCalcMethod = parseInt(e.detail.value);
    this.setData({ subCalcMethod });
    app.globalData.socket.emit('calc method', { id: this.data.id, subCalcMethod });
  },
  onResultChange(e) {
    const result = parseFloat(e.detail.value);
    app.globalData.socket.emit('calc method', { id: this.data.id, result });
  },
  onBackTap() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: `../index/index` });
    }
  }
});
