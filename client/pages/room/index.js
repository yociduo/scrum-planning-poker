const app = getApp();
const cards = require('../../utils/cards.js');
const util = require('../../utils/util.js');

let interval;

Page({
  data: {
    timer: 0,
    displayTime: '00:00:00',
    stories: [],
    players: [],
    storyList: [],
    currentStory: '',
    currentStoryIndex: -1,
    selectedValue: null,
    selectedDisplay: '',
    selectedCalcMethod: 0,
    selectedResultType: 0,
    calcMethods: [
      'Arithmetic Mean',
      'Truncated Mean',
    ],
    newStories: '',
    hasNewStories: false,
  },

  onLoad: function (options) {
    const { keys } = wx.getStorageInfoSync();
    const { id, needScore, name, stories: _stories } = options;
    const isHost = keys.includes('hosted') && wx.getStorageSync('hosted').includes(id);
    const title = name ? decodeURIComponent(name) : 'Room';
    const storyList = [];
    const stories = decodeURIComponent(_stories).split('\n').filter(i => i);
    this.setData({ isHost, id, cards, stories, storyList });

    wx.setNavigationBarTitle({ title });

    interval = setInterval(() => {
      const timer = this.data.timer + 1;
      const displayTime = util.formatTimer(timer);
      this.setData({ timer, displayTime });
    }, 1000); 

    if (isHost) {
    }

    // mock players
    wx.getUserInfo({
      success: ({userInfo}) => {
        console.log(userInfo);
        // app.globalData.socket.emit('message', 1);
      }
    });

    // wx.connectSocket({
    //   url: `${socketUrl}&`,
    //   header: {},
    //   method: '',
    //   protocols: [],
    //   success: function(res) {
    //   },
    //   fail: function(res) {},
    //   complete: function(res) {},
    // })

    // io.

    // wx.onSocketMessage(function(res){
    //   console.log(res);
    // })

  },

  onUnload: function () {
    clearInterval(interval);
  },

  onShareAppMessage: function () {
    const { name: title, story: desc } = this.data;
    return { title, desc };
  },

  onCardClick: function (e) {
    if (true) {
      const { value: selectedValue } = e.target.dataset;
      if (selectedValue === this.data.selectedValue) {
        this.setData({ selectedValue: null, selectedDisplay: '' });
      } else {
        this.setData({ 
          selectedValue, 
          selectedDisplay: cards.find(({ value }) => value === selectedValue).key 
        });
      }
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
    this.setData({ selectedCalcMethod: e.detail.value });
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