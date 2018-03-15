const app = getApp();
const cards = require('../../utils/cards.js');

Page({
  data: {
    players: [],
    selectedCalcMethod: 0,
    selectedResultType: 0,
    calcMethods: [
      'Arithmetic mean',
      'Truncated mean',
    ]
  },
  onLoad: function (options) {
    const { keys } = wx.getStorageInfoSync();
    const { id, name: _name, story: _story } = options;
    const isHost = keys.includes('hosted') && wx.getStorageSync('hosted').includes(id);
    console.log(isHost);
  

    // const { needScore = false, isHost = false } = app.globalData;
    // const { id, name: _name, story: _story } = options;
    // const name = _name ? decodeURIComponent(_name) : 'Room';
    // const story = _story ? decodeURIComponent(_story) : 'Story';

    // wx.getStorage({
    //   key: id,
    //   success: function(res) {
    //     console.log(res)
    //   },
    //   fail: function(res) {},
    //   complete: function(res) {},
    // })

    // wx.getStorageInfo({
    //   success: function(res) {},
    //   fail: function(res) {},
    //   complete: function(res) {},
    // })

    // this.setData({ isHost, needScore, id, name, story, cards });

    // // mock players
    // wx.getUserInfo({
    //   success: ({userInfo}) => {
    //     console.log(userInfo)
    //     this.setData({ players: [userInfo] });
    //   }
    // });
  },

  onShareAppMessage: function () {
    const { name: title, story: desc } = this.data;
    return { title, desc };
  },

  onCardClick: function (e) {
    if (true) {
      const { value: selectedValue } = e.target.dataset;
      this.setData({ selectedValue });
    }
  },

  onCalcMethodChange: function (e) {
    this.setData({ selectedCalcMethod: e.detail.value });
  },

  onResultTypeChange: function (e) {
    this.setData({ selectedResultType: e.detail.value });
  }
  
});