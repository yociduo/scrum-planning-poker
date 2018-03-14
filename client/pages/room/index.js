const app = getApp();
const cards = require('../../utils/cards.js');

Page({
  data: {
  },
  onLoad: function (options) {
    const { needScore, isHost } = app.globalData;
    const { id, name: _name, story: _story } = options;
    const name = _name ? decodeURIComponent(_name) : 'Room';
    const story = _story ? decodeURIComponent(_story) : 'Story';

    this.setData({ isHost, needScore, id, name, story, cards });
  },

  onShareAppMessage: function () {

    
    const { name: title, story: desc } = this.data;
    return { title, desc }
  }
})