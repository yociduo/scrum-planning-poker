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
      const id = Math.ceil(Math.random() * 10000).toString();

      app.globalData.isHost = true;
      
      wx.navigateTo({
        url: `../room/index?id=${id}&name=${room}&stories=${stories}&needScore=${needScore}`,
      });
    }   
  }
})
