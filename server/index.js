const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => { };

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
};

const formatTimer = timer => {
  const hour = Math.floor(timer / 3600);
  const minute = Math.floor((timer % 3600) / 60);
  const second = timer % 60;
  return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`
};

const emit = (socket, room, keys = null) => {
  let payload = { id: room.id };
  if (keys) {
    if (keys.toString() === '[object Set]') {
      keys = Array.from(keys);
    }

    if (keys.length) {
      keys.forEach(key => payload[key] = room[key]);
    } else {
      return;
    }
  } else {
    for (const key in room) {
      if (room.hasOwnProperty(key) && !key.startsWith('_')) {
        payload[key] = room[key];
      }
    }
  }

  log('[emit]', payload);
  socket.emit('action', payload);
};

const emitAll = (room, keys) => {
  room._sockets.forEach(socket => emit(socket, room, keys));
};

const error = (socket, msg) => {
  log('[error]', msg);
  socket.error(msg);
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
    log('[create room]', { stories, ...room });
    if (!rooms.hasOwnProperty(room.id)) {
      room._stories = decodeURIComponent(stories).split('\n').filter(i => i);
      room._sockets = new Set();
      room._interval = null;
      room._storyIndex = -1;
      room.players = [];
      room.scores = [];
      room.currentStory = '';
      room.start = false;
      room.finished = room._stories.length > 0;
      room.hasNext = room._stories.length > 1;
      room.timer = 0;
      room.calcMethod = 0;
      room.averageScore = '';
      room.medianScore = '';
      rooms[room.id] = room;
    }
  });

  socket.on('next story', ({ id, stories }) => {
    log('[next story]', { id, stories });
    if (rooms.hasOwnProperty(id)) {
      const room = rooms[id];
      const keys = new Set();;

      // push new stories
      if (stories) {
        decodeURIComponent(stories).split('\n').forEach(i => i && room._stories.push(i));
      }

      // save scores
      if (room._storyIndex !== -1) {
        room.scores.push({
          name: room.currentStory,
          time: formatTimer(room.timer),
          score: 'Todo'
        });
        keys.add('scroes');
      } else {
        room.start = true;
        keys.add('start');
        room._interval = setInterval(() => room.timer++, 1000);
      }

      room._storyIndex++;
      room.timer = 0;
      keys.add('timer');

      const { length } = room._stories;
      if (length > room._storyIndex) {
        if (room.hasNext !== ((length - 1) > room._storyIndex)) {
          room.hasNext = !room.hasNext;
          keys.add('hasNext');
        }

        room.currentStory = room._stories[room._storyIndex];
        keys.add('currentStory');
      } else {
        room.start = false;
        keys.add('start');
        room.finished = true;
        keys.add('finished');
        if (room._interval) {
          clearInterval(room._interval);
        }
      }

      emitAll(room, keys);
    } else {
      error(socket, 'Room has been deleted');
    }
  });

  socket.on('join room', ({ id, userInfo }) => {
    log('[join room]', { id, userInfo });
    socket.nickName = userInfo.nickName;

    if (rooms.hasOwnProperty(id)) {
      const room = rooms[id];
      room._sockets.add(socket);
      emit(socket, room);
      if (room.players.findIndex(({ nickName }) => userInfo.nickName === nickName) === -1) {
        const player = { ...userInfo };
        player.score = null;
        room.players.push(player);
        emitAll(room, ['players']);
      }
    } else {
      error(socket, 'Room has been deleted');
    }
  });

  socket.on('disconnect', () => {
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
