const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cards = require('./cards');
const { formatNumber, formatTimer } = require('./util');

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => { };

const initPayload = {
  init: true,
  cards,
  calcMethods: [
    'Arithmetic Mean',
    'Truncated Mean',
  ],
  info1: 'Voting...',
  info2: 'All Stories',
  inviteIconUrl: '../../image/invite-black.png',
  shareImageUrl: '',
};

const emit = (socket, room, keys = null) => {
  let payload = { id: room.id };
  const { players, ...rest } = room;

  const toPlayers = () => players.map((player, index) => {
    const score = player.score === null ? '' : cards.find(c => c.value === player.score).key;
    const needAnnoymous = !room.isNoymous && !socket.isHost && socket.nickName !== player.nickName;
    const nickName = needAnnoymous ? `Player ${index + 1}` : player.nickName;
    const avatarUrl = (needAnnoymous ? '' : player.avatarUrl) || '../../image/user.png';
    return { score, nickName, avatarUrl };
  })


  rest.players = players.map((player, index) => {
    const score = player.score === null ? '' : cards.find(c => c.value === player.score).key;
    const needAnnoymous = !room.isNoymous && !socket.isHost && socket.nickName !== player.nickName;
    const nickName = needAnnoymous ? `Player ${index + 1}` : player.nickName;
    const avatarUrl = (needAnnoymous ? '' : player.avatarUrl) || '../../image/user.png';
    return { score, nickName, avatarUrl };
  });

  if (keys) {
    if (keys.toString() === '[object Set]') {
      keys = Array.from(keys);
    }

    if (keys.length) {
      keys.forEach(key => {
        switch (key) {
          case 'players': payload[key] = toPlayers(); break;
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
          case 'players': payload[key] = toPlayers(); break;
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

const error = (socket, msg) => {
  log('[error]', msg);
  socket.error(msg);
};

const calculator = (room) => {
  const { calcMethod, players } = room;
  const scores = players
    .map(p => p.score)
    .filter(s => s !== null && s >= 0)
    .sort((a, b) => a - b);

  if (scores.length === 0) {
    room.averageScore = '';
    room.medianScore = '';
    return;
  }

  if (scores.length > 2 && room.calcMethod === 1) {
    scores.pop();
    scores.splice(0, 1);
  }

  console.log('calc scores', scores);

  const { length } = scores;
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += scores[i];
  }

  room.averageScore = Math.round(sum / length);
  if (length % 2 === 0) {
    room.medianScore = Math.round((scores[length / 2] + scores[length / 2 - 1]) / 2);
  } else {
    room.medianScore = scores[(length - 1) / 2];
  }
};

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

  socket.on('create room', ({ stories, ...room }) => {
    log('[create room]', { stories, name, ...room });
    if (rooms.hasOwnProperty(room.id)) return error(socket, 'Room is duplicated!');

    room._stories = decodeURIComponent(stories).split('\n').filter(i => i);
    room._sockets = new Set();
    room._interval = null;
    room._storyIndex = -1;
    room._timer = 0;
    room.name = decodeURIComponent(name);
    room.players = [];
    room.scores = [];
    room.currentStory = '';
    room.loading = false;
    room.start = false;
    room.finished = room._stories.length === 0;
    room.hasNext = room._stories.length > 1;
    room.displayTime = '00:00:00';
    room.calcMethod = 0;
    room.averageScore = '';
    room.medianScore = '';
    rooms[room.id] = room;
  });

  socket.on('next story', ({ id, resultType, stories }) => {
    log('[next story]', { id, resultType, stories });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');
    const room = rooms[id];
    const keys = new Set();;

    // push new stories
    if (stories) decodeURIComponent(stories).split('\n').forEach(i => i && room._stories.push(i));

    if (room._storyIndex !== -1) {
      // save scores
      room.scores.push({
        name: room.currentStory,
        time: room.displayTime,
        score: parseInt(resultType) === 0 ? room.averageScore : room.medianScore
      });
      keys.add('scores');
    } else {
      room.start = true;
      keys.add('start');
      room._interval = setInterval(() => {
        room._timer++;
        room.displayTime = formatTimer(room._timer);
        emitAll(room, ['displayTime']);
      }, 1000);
    }

    room._storyIndex++;
    room._timer = 0;

    const { length } = room._stories;
    if (length > room._storyIndex) {
      if (room.hasNext !== ((length - 1) > room._storyIndex)) {
        room.hasNext = !room.hasNext;
        keys.add('hasNext');
      }

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
      room.displayTime = '00:00:00';
      keys.add('displayTime');
      room.currentStory = 'Congratulations!';
      keys.add('currentStory');
    }

    room.loading = false;
    keys.add('loading');
    room.players.forEach(p => p.score = null);
    keys.add('players');
    room.selectedCard = null;
    keys.add('selectedCard');
    room.averageScore = '';
    keys.add('averageScore');
    room.medianScore = '';
    keys.add('medianScore');

    emitAll(room, keys);
  });

  socket.on('join room', ({ id, userInfo, isHost }) => {
    log('[join room]', { id, userInfo, isHost });
    if (!rooms.hasOwnProperty(id)) return socket.emit('init', { ...initPayload, finished: true, currentStory: 'Congratulations!', id });
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
      emitAll(room, ['players', 'averageScore', 'medianScore']);
    }
  });

  socket.on('calc method', ({ id, calcMethod }) => {
    log('[calc method]', { id, calcMethod });
    if (!rooms.hasOwnProperty(id)) return error(socket, 'Room has been deleted!');
    const room = rooms[id];
    room.calcMethod = parseInt(calcMethod);
    calculator(room);
    emitAll(room, ['averageScore', 'medianScore']);
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
