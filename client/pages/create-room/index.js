const app = getApp();
const initStories = new Array(3).fill(null).map((n, i) => 'Story ' + (i + 1)).join('\n');
const initRoom = 'Room';

Page({
  data: {
    room: initRoom,
    stories: initStories
  },
  onRoomBlur(e) {
    const { value } = e.detail;
    if (!value || !/\w+/.test(value)) {
      this.setData({ room: initRoom });
    }
  },
  onStoriesBlur(e) {
    const { value } = e.detail;
    if (!value || !/\w+/.test(value)) {
      this.setData({ stories: initStories });
    }
  },
  formSubmit(e) {
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
        url: `../room/index?id=${id}`,
      });
    }
  }
})
