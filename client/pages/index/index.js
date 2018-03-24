const app = getApp();

Page({
  data: {
    rooms: []
  },
  onShow() {
    console.log('Todo: get room list');
    const { keys } = wx.getStorageInfoSync();
    const rooms = keys
      .filter(i => /\d/.test(i))
      .map(id => {
        const { name, scores } = wx.getStorageSync(id);
        const count = scores ? scores.length : 0;
        const score = 24
        return { id, name, count, score };
      });
    this.setData({ rooms });
  },
  onCreateTap() {
    wx.navigateTo({ url: '../create-room/index' });
  },
  onRoomTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `../room-detail/index?id=${id}` });
  }
})