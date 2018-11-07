const { apiUrl } = require('../../config');
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
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    const { room: name, stories, needScore, isNoymous } = e.detail.value;
    if (name) {
      // // generate id
      // const id = Math.ceil(Math.random() * 10000000).toString();

      // // store hosted room id
      // const hosted = wx.getStorageSync('hosted') || [];
      // hosted.push(id);
      // wx.setStorageSync('hosted', hosted);

      // app.globalData.socket.emit('create room', {
      //   id,
      //   needScore,
      //   isNoymous,
      //   name: encodeURIComponent(room),
      //   stories: encodeURIComponent(stories),
      // });

      wx.request({
        url: `${apiUrl}/rooms`,
        method: 'POST',
        data: {
          name,
          stories: stories.trim().split('\n').map(name => name.trim()).filter(n => n).map(name => ({ name })),
          options: {
            needScore,
            isNoymous,
            calcMethod: 0
          },
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: ({ data, statusCode }) => {
          if (statusCode === 200) {
            wx.redirectTo({ url: `../room/index?id=${data.id}` });
          }
        },
        complete: () => {
          this.setData({ submitting: false });
        }
      });
    }
  }
})
