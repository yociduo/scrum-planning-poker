Page({
  onLoad(options) {
    const { id } = options;
    const room = wx.getStorageSync(id);
    if (room) {
      room.id = id;
      room.scores.forEach((s, id) => s.id = id);
      this.setData({ ...room });
    } else {
      wx.showModal({
        title: 'Error',
        content: 'Room has been deleted!',
        confirmColor: '#0678C1',
        showCancel: false,
        confirmText: 'OK',
        success: () => this.onBackTap(),
      });
    }
  },
  onRoomChange(e) {
    this.setData({ name: e.detail.value });
    const room = wx.getStorageSync(this.data.id);
    room.name = e.detail.value;
    wx.setStorageSync(this.data.id, room);
  },
  kindToggle: function (e) {
    const id = e.currentTarget.id, scores = this.data.scores;
    for (let i = 0, len = scores.length; i < len; ++i) {
      if (scores[i].id == id) {
        scores[i].open = !scores[i].open
      } else {
        scores[i].open = false
      }
    }
    this.setData({ scores });
  },
  onBackTap: function (e) {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: `../index/index` });
    }
  }
});