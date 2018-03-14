const app = getApp();

Page({
  data: {

  },
  onLoad: function () {

  },
  formSubmit: function (e) {
    const { room, story, needScore } = e.detail.value;
    const id = Math.ceil(Math.random() * 10000);

    app.globalData.needScore = needScore;
    app.globalData.isHost = true;

    wx.navigateTo({
      url: `../room/index?id=${id}&name=${room || 'Room'}&story=${story || 'Story'}`,
    });
  }
})
