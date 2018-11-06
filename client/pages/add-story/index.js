const app = getApp();
let id, initStories;

Page({
  onLoad(options) {
    id = options.id;
    // const start = wx.getStorageSync(id).scores.length + 1;
    const start = 1;
    initStories = new Array(3).fill(null).map((n, i) => 'Story ' + (i + start)).join('\n');
    this.setData({ stories: initStories });
  },
  onStoryChange(e) {
    this.setData({ stories: e.detail.value });
  },
  onStoriesBlur() {
    if (!this.data.stories || !/\w+/.test(this.data.stories)) {
      this.setData({ stories: initStories });
    }
  },
  formSubmit(e) {
    const { stories } = e.detail.value;
    app.globalData.socket.emit('add story', { id, stories: stories.trim().split('\n').map(name => name.trim()).filter(n => n).map(name => ({ name })) });
    wx.navigateBack({ delta: 1 });
  }
})
