const app = getApp();
const initStories = new Array(3).fill(null).map((n, i) => 'Story ' + (i + 1)).join('\n');
const initRoom = 'Room';

Page({
  data: {
    room: initRoom,
    stories: initStories
  },
  onLoad: function () {

  },
  onRoomChange: function (e) {
    this.setData({ room: e.detail.value });
  },
  onRoomFocus: function () {
    this.setData({ room: '' });
  },
  onRoomBlur: function () {
    if (!this.data.room) {
      this.setData({ room: initRoom })
    }
  },
  onStoryChange: function (e) {
    this.setData({ stories: e.detail.value });
  },
  onStoriesBlur: function () {
    if (!this.data.stories || !/\w+/.test(this.data.stories)) {
      this.setData({ stories: initStories });
    }
  },
  formSubmit: function (e) {
    const { room, stories, needScore, isNoymous } = e.detail.value;
    if (room) {
      // generate id
      const id = Math.ceil(Math.random() * 10000000).toString();

      // store hosted room id
      const hosted = wx.getStorageSync('hosted') || [];
      hosted.push(id);
      wx.setStorageSync('hosted', hosted);

      app.globalData.socket.emit('create room', {
        id,
        needScore,
        isNoymous,
        name: encodeURIComponent(room),
        stories: encodeURIComponent(stories),
      });

      wx.navigateTo({
        url: `../room/index?id=${id}&name=${encodeURIComponent(room)}&stories=${encodeURIComponent(stories)}&needScore=${needScore}&isNoymous=${isNoymous}`,
      });
    }
  }
})
