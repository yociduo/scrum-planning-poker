const app = getApp();

Page({
  data: {
    selectedResultType: 0,
    newStories: '',
    hasNewStories: false,
  },

  onLoad: function (options) {
    const { id } = options;
    const isHost = (wx.getStorageSync('hosted') || []).includes(id);
    this.setData({ id, isHost });

    wx.getUserInfo({
      success: ({ userInfo }) => app.globalData.socket.emit('join room', { id, userInfo, isHost })
    });

    app.globalData.socket.on('init', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      const title = payload.name;
      wx.setNavigationBarTitle({ title });
      this.setData(payload);
      if (isHost && !payload.start) {
        app.globalData.socket.emit('next story', { id });
      }
    });

    app.globalData.socket.on('action', ({ id, ...payload }) => {
      if (id !== this.data.id) return;
      this.setData(payload);
    });

    app.globalData.socket.on('error', (content) => wx.showModal({
      title: 'Error',
      content,
      showCancel: false,
      confirmText: 'OK'
    }));
  },

  onShareAppMessage: function () {
    return { title: this.data.name };
  },

  onCardClick: function (e) {
    const { id, start, selectedCard } = this.data;
    if (this.data.start) {
      const { card } = e.target.dataset;
      this.setData({ selectedCard: card && card.value });
      app.globalData.socket.emit('select card', { id, card });
    }
  },

  onSaveAndNext: function () {
    const { stories, currentStoryIndex } = this.data;
    if (currentStoryIndex < stories.length - 1) {
      // Mock
      if (this.data.currentStory) {
        const { currentStory: name, displayTime: time, selectedDisplay: score } = this.data;
        this.addStoryResult({ name, time, score });
      }

      const currentStoryIndex = this.data.currentStoryIndex + 1;
      this.setData({ currentStoryIndex });
      this.setCurrentStory(stories[currentStoryIndex]);
    }
  },

  onSaveAndFinish: function () {
    const { hasNewStories } = this.data;

    // Mock
    if (this.data.currentStory) {
      const { currentStory: name, displayTime: time, selectedDisplay: score } = this.data;
      this.addStoryResult({ name, time, score });
    }

    if (hasNewStories) {
      this.onAddNewStories();
      const currentStoryIndex = this.data.currentStoryIndex + 1;
      this.setData({ currentStoryIndex });
      this.setCurrentStory(stories[currentStoryIndex]);
    }
  },

  onCalcMethodChange: function (e) {
    const calcMethod = e.detail.value;
    this.setData({ calcMethod });
    app.globalData.socket.emit('calc method', { id: this.data.id, calcMethod });
  },

  onResultTypeChange: function (e) {
    this.setData({ selectedResultType: e.detail.value });
  },

  setCurrentStory: function (currentStory) {
    this.setData({ currentStory });
  },

  addStoryResult: function (result) {
    const { storyList } = this.data;
    storyList.push(result);
    this.setData({
      storyList,
      selectedValue: null,
      selectedDisplay: '',
      timer: -1,
    });
  },

  onNewStoriesChange: function (e) {
    const newStories = e.detail.value;
    this.setData({
      newStories,
      hasNewStories: newStories && newStories.trim().split('\n').filter(i => i).length > 0
    });
  },

  onAddNewStories: function () {
    const { newStories, stories } = this.data;
    if (newStories) {
      this.setData({
        newStories: '',
        stories: stories.concat(newStories.trim().split('\n').filter(i => i))
      });
    }
  }
});
