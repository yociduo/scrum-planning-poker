const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => {};
const emit = (socket, type, payload) => {
  const action = { type, payload };
  log('[emit]', action);
  socket.emit('action', action);
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
      rooms[room.id] = room;
    }
  });

  socket.on('next story', ({ roomId }) => {
    log('[next story]', { roomId });
    if (rooms.hasOwnProperty(roomId)) {
      const room = rooms[roomId];
      if (room.currentStoryIndex > -1) {
        console.log('save result');
      }

      room.currentStoryIndex++;
      log(room.currentStoryIndex > room.stories.length);
    } else {
      error(socket, 'Room has been deleted');
    }
  });

  socket.on('join room', ({ roomId, userInfo }) => {
    log('[join room]', { roomId, userInfo });
    if (rooms.hasOwnProperty(roomId)) {
      const room = rooms[roomId];
      room.sockets.add(socket);
      emit(socket, 1, room);
      if (room.players.findIndex(({ nickName }) => userInfo.nickName === nickName) === -1) {
        room.players.push({...userInfo});
        room.sockets.forEach(s => emit(s, 2, room.players));
      }
    } else {
      error(socket, 'Room has been deleted');
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
