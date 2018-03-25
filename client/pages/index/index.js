const app = getApp();

Page({
  data: {
    rooms: []
  },
  onShow() {
    const rooms = (wx.getStorageSync('hosted') || []).reverse().map(id => {
      const { name, count, time, total, finished } = wx.getStorageSync(id);
      return { id, name, count, time, total, finished };
    });
    this.setData({ rooms });
  },
  onCreateTap() {
    wx.navigateTo({ url: '../create-room/index' });
  },
  onRoomTap(e) {
    const { id, finished } = e.currentTarget.dataset.room;
    wx.navigateTo({ url: `../room${finished ? '-detail' : ''}/index?id=${id}` });
  }
})
