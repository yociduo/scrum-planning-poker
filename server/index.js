const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => { };
const emit = (socket, type, payload) => {
  const action = { type, payload };
  log('[emit]', action);
  socket.emit('action', action);
};

const emitAll = (room, type, payload) => {
  room.sockets.forEach(socket => emit(socket, type, payload));
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
      room.stories = decodeURIComponent(stories).split('\n').filter(i => i);
      room.players = [],
        room.scores = [],
        room.sockets = new Set(),
        room.currentStoryIndex = -1;
      room.finished = false;
      rooms[room.id] = room;
    }
  });

  socket.on('next story', ({ roomId, stories }) => {
    log('[next story]', { roomId });
    if (rooms.hasOwnProperty(roomId)) {
      const room = rooms[roomId];

      // push new stories
      if (stories) {
        decodeURIComponent(stories).split('\n').forEach(i => i && room.stories.push(i));
      }

      room.currentStoryIndex++;
      if (room.currentStoryIndex > 0) {
        console.log('Todo: save result');
      }

      const { length } = room.stories;
      if (length > room.currentStoryIndex) {
        const hasNext = (length - 1) > room.currentStoryIndex;
        const currentStory = room.stories[room.currentStoryIndex];
        emitAll(room, 3, { hasNext, currentStory });
      } else {
        room.finished = true;
        emitAll(room, 1, room);
      }
    } else {
      error(socket, 'Room has been deleted');
    }
  });

  socket.on('join room', ({ roomId, userInfo }) => {
    log('[join room]', { roomId, userInfo });
    socket.nickName = userInfo.nickName;

    if (rooms.hasOwnProperty(roomId)) {
      const room = rooms[roomId];
      room.sockets.add(socket);
      emit(socket, 1, room);
      if (room.players.findIndex(({ nickName }) => userInfo.nickName === nickName) === -1) {
        const player = { ...userInfo };
        player.score = null;
        room.players.push(player);
        emitAll(room, 2, room.players);
      }
    } else {
      error(socket, 'Room has been deleted');
    }
  });

  socket.on('disconnect', () => {
    for (const key in rooms) {
      if (rooms.hasOwnProperty(key)) {
        const room = rooms[key];
        if (room.sockets.has(socket)) {
          room.sockets.delete(socket);
          const findIndex = room.players.findIndex(p => p.nickName === socket.nickName);
          if (findIndex !== -1 && room.players[findIndex].score === null) {
            room.players.splice(findIndex, 1);
            console.log('1');
            emitAll(room, 2, room.players);
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
