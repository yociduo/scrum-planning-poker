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
        const { name, count, time, total } = wx.getStorageSync(id);
        return { id, name, count, time, total };
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