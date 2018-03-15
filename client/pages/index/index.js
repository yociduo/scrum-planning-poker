const app = getApp();

Page({
  data: {
    room: 'Room',
  },
  onLoad: function () {

  },
  onRoomChange: function (e) {
    const { value: room } = e.detail;
    this.setData({ room });
  },
  formSubmit: function (e) {
    const { room, stories, needScore } = e.detail.value;
    if (room) {
      const id = Math.ceil(Math.random() * 10000000).toString();
      const { keys } = wx.getStorageInfoSync();
      let hosted;
      if (keys.includes('hosted')) {
        hosted = wx.getStorageSync('hosted');
        hosted.push(id);
      } else {
        hosted = [id];
      }
      wx.setStorageSync('hosted', hosted);
      wx.navigateTo({
        url: `../room/index?id=${id}&name=${room}&stories=${stories}&needScore=${needScore}`,
      });
    }   
  }
})
