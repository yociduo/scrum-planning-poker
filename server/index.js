const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cards = require('./cards');
const { formatNumber, formatTimer } = require('./util');

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => { };

const initResults = new Array(31).fill(null).map((v, i) => i).concat([0.5, 40, 55, 89, 100]).sort((i, j) => i - j);

const initPayload = {
  init: true,
  cards,
  results: initResults,
  inviteIconUrl: '../../image/user-plus.png',
  addStoryIconUrl: '../../image/plus.png',
  shareImageUrl: '',
  calcMethods: [
    {
      key: 'Average',
      value: 0,
      sub: [
        {
          key: 'Arithmetic Mean',
          value: 0
        },
        {
          key: 'Truncated Mean',
          value: 1
        }
      ]
    },
    {
      key: 'Median',
      value: 1
    },
    {
      key: 'Customized',
      value: 2
    }
  ]
};

const toPlayers = (players, isNoymous, socket) => players.map((player, index) => {
  const { nickName, avatarUrl = '../../image/user.png' } = player;
  const needAnnoymous = !isNoymous && !socket.isHost && socket.nickName !== player.nickName;
  const hasScore = player.score !== null;
  const showCheck = needAnnoymous && hasScore;
  const score = !needAnnoymous && hasScore ? cards.find(c => c.value === player.score).key : '';
  return { nickName, avatarUrl, score, showCheck };
});

const emit = (socket, room, keys = null) => {
  let payload = { id: room.id };
  const { players, isNoymous, ...rest } = room;

  if (keys) {
    if (keys.toString() === '[object Set]') {
      keys = Array.from(keys);
    }

    if (keys.length) {
      keys.forEach(key => {
        switch (key) {
          case 'players': payload[key] = toPlayers(players, isNoymous, socket); break;
          default: payload[key] = rest[key]; break;
        }
      });
      log('[emit]', payload);
      socket.emit('action', payload);
    }
  } else {
    for (const key in room) {
      if (room.hasOwnProperty(key) && !key.startsWith('_')) {
        switch (key) {
          case 'players': payload[key] = toPlayers(players, isNoymous, socket); break;
          default: payload[key] = rest[key]; break;
        }
      }
    }

    const player = players.find(i => i.nickName === socket.nickName);
    payload.selectedCard = player ? player.score : null;
    payload = { ...initPayload, ...payload };

    log('[init]', payload);
    socket.emit('init', payload);
  }
};

const emitAll = (room, keys) => {
  room._sockets.forEach(socket => emit(socket, room, keys));
};

const emitHost = (room, keys) => {
  room._sockets.forEach(socket => socket.isHost && emit(socket, room, keys));
};

const error = (socket, msg) => {
  log('[error]', msg);
  socket.error(msg);
};

const calculator = (room) => {
  const { calcMethod, subCalcMethod, players } = room;

  if (calcMethod === 2) {
    return;
  }

  const scores = players
    .map(p => p.score)
    .filter(s => s !== null && s >= 0)
    .sort((a, b) => a - b);

  if (scores.length === 0) {
    room.result = null;
    return;
  } else if (scores.length > 2 && room.subCalcMethod === 1) {
    scores.pop();
    scores.splice(0, 1);
  }

  const { length } = scores;
  let result;

  if (calcMethod === 0) {
    result = scores.reduce((v, s) => v + s, 0) / length;
  } else {
    result = length % 2 === 0 ?
      Math.round((scores[length / 2] + scores[length / 2 - 1]) / 2) : scores[(length - 1) / 2]
  }

  room.result = initResults.map((value, index) => ({
    value,
    index,
    abs: Math.abs(value - result)
  })).sort((i, j) => {
    if (i.abs > j.abs) {
      return 1;
    } else if (i.abs < j.abs) {
      return -1;
    } else {
      return j.value - i.value;
    }
  })[0].index;
};

const setIntervalTimer = (room) => setInterval(() => {
  if (room._timer < 3600 * 3) {
    room._timer++;
    room.displayTime = formatTimer(room._timer);
    emitAll(room, ['displayTime']);
  } else {
    clearInterval(room._interval);
    room.start = false;
    room.finished = true;
    room.closed = true;
    room.currentStory = 'Continue with this room & add story!';
    emitAll(room, ['start', 'finished', 'currentStory', 'closed']);
  }
}, 1000);

if (debug) {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/host', (req, res) => {
    res.sendFile(__dirname + '/host.html');
  });

  app.get('/player', (req, res) => {
    res.sendFile(__dirname + '/player.html');
  });
}

// rooms dictionary
const rooms = {};

io.on('connection', (socket) => {
  log('a user connected');

  socket.on('create room', ({ stories, name, ...room }) => {
    log('[create room]', { stories, name, ...room });
    if (rooms.hasOwnProperty(room.id)) return error(socket, 'Room is duplicated!');

    room._stories = decodeURIComponent(stories).split('\n').filter(i => i);
    room._sockets = new Set();
    room._interval = null;
    room._storyIndex = -1;
    room._timer = 0;
    room._allTimer = 0;
    room._allScore = 0;
    room.name = decodeURIComponent(name);
    room.players = [];
    room.scores = [];
    room.currentStory = '';
    room.loading = false;
    room.start = false;
    room.finished = room._stories.length === 0;
    // room.hasNext = room._stories.length > 1;
    room.displayTime = '00:00:00';
    room.calcMethod = 0;
    room.subCalcMethod = 0;
    room.count = '0 Story';
    room.time = '00:00:00';
    room.total = 0;
    rooms[room.id] = room;
  });

  socket.on('next story', ({ id }) => {
    log('[next story]', { id });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');
    const room = rooms[id];
    const keys = new Set();;

    if (room._storyIndex !== -1) {
      // save scores
      const { result, currentStory: name, displayTime: time, players } = room;
      const score = result === null || result === undefined ? '' : initResults[result];
      const details = players.map(({ nickName, score }) => ({ nickName, score }));
      const count = room.scores.push({ score, name, time, details });
      keys.add('scores');
      room._allTimer += room._timer;
      room.count = `${count} stor${count > 1 ? 'ies' : 'y'}`;
      keys.add('count');
      room.time = formatTimer(room._allTimer);
      keys.add('time');
      room.total += +score;
      keys.add('total');
      room.calcMethod = 0;
      keys.add('calcMethod');
      room.subCalcMethod = 0;
      keys.add('subCalcMethod');
      room.result = null;
      keys.add('result');
    } else {
      room.start = true;
      keys.add('start');
      room._interval = setIntervalTimer(room);
    }

    room._storyIndex++;
    room._timer = 0;
    room.displayTime = '00:00:00';
    keys.add('displayTime');

    const { length } = room._stories;
    if (length > room._storyIndex) {
      // if (room.hasNext !== ((length - 1) > room._storyIndex)) {
      //   room.hasNext = !room.hasNext;
      //   keys.add('hasNext');
      // }

      room.currentStory = room._stories[room._storyIndex];
      keys.add('currentStory');
    } else {
      if (room._interval) {
        clearInterval(room._interval);
      }

      room.start = false;
      keys.add('start');
      room.finished = true;
      keys.add('finished');
      room.currentStory = 'Continue with this room & add story!';
      keys.add('currentStory');
    }

    room.loading = false;
    keys.add('loading');
    room.players.forEach(p => p.score = null);
    keys.add('players');
    room.selectedCard = null;
    keys.add('selectedCard');

    emitAll(room, keys);
  });

  socket.on('add story', ({ id, stories }) => {
    log('[add story]', { id, stories });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');

    if (stories) {
      const room = rooms[id];
      decodeURIComponent(stories).split('\n').forEach(i => i && room._stories.push(i));

      if (room.finished) {
        room.finished = false;
        room.currentStory = room._stories[room._storyIndex];
        room.start = true;
        room._interval = setIntervalTimer(room);
        emitAll(room, ['start', 'finished', 'currentStory']);
      }
    }
  });

  socket.on('join room', ({ id, userInfo, isHost }) => {
    log('[join room]', { id, userInfo, isHost });
    if (!rooms.hasOwnProperty(id)) return socket.emit('init', { ...initPayload, finished: true, closed: true, currentStory: 'Continue with this room & add story!', id });
    const room = rooms[id];
    room._sockets.add(socket);
    socket.nickName = userInfo.nickName;
    socket.isHost = isHost;
    emit(socket, room);
    if (!room.needScore && isHost) return;
    if (room.players.findIndex(({ nickName }) => userInfo.nickName === nickName) === -1) {
      const player = { ...userInfo };
      player.score = null;
      room.players.push(player);
      emitAll(room, ['players']);
    }
  });

  socket.on('select card', ({ id, card }) => {
    log('[select card]', { id, card });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');
    if (!socket.nickName) return error(socket, 'Did join the room');
    const room = rooms[id];
    const player = room.players.find(p => p.nickName === socket.nickName);
    if (player) {
      player.score = card ? card.value : null;
      calculator(room);
      emitAll(room, ['players']);
      emitHost(room, ['result']);
    }
  });

  socket.on('calc method', ({ id, calcMethod, subCalcMethod, result }) => {
    log('[calc method]', { id, calcMethod });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');
    const room = rooms[id];

    if (calcMethod !== null && calcMethod !== undefined) {
      room.calcMethod = calcMethod;
    }

    if (subCalcMethod !== null && subCalcMethod !== undefined) {
      room.subCalcMethod = subCalcMethod;
    }

    if (result !== null && result !== undefined) {
      room.result = result;
      room.calcMethod = 2;
    }

    calculator(room);
    emitHost(room, ['calcMethod', 'subCalcMethod', 'result']);
  });

  socket.on('disconnect', () => {
    log('disconnect');
    for (const key in rooms) {
      if (rooms.hasOwnProperty(key)) {
        const room = rooms[key];
        if (room._sockets.has(socket)) {
          room._sockets.delete(socket);
          const findIndex = room.players.findIndex(p => p.nickName === socket.nickName);
          if (findIndex !== -1 && room.players[findIndex].score === null) {
            room.players.splice(findIndex, 1);
            emitAll(room, ['players']);
          }
        }
      }
    }
  });

  if (debug) {
    socket.on('chat message', function (msg) {
      io.emit('chat message', msg);
    });
  }
});

http.listen(port, () => {
  log(`listening on *:${port}`);
});
