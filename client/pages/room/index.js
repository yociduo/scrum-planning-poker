const app = getApp();
const cards = require('../../utils/cards.js');

Page({
  data: {
    players: []
  },
  onLoad: function (options) {
    const { needScore = false, isHost = false } = app.globalData;
    const { id, name: _name, story: _story } = options;
    const name = _name ? decodeURIComponent(_name) : 'Room';
    const story = _story ? decodeURIComponent(_story) : 'Story';

    this.setData({ isHost, needScore, id, name, story, cards });

    // mock players
    wx.getUserInfo({
      success: ({userInfo}) => {
        console.log(userInfo)
        this.setData({ players: [userInfo] });
      }
    });
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
  }
});