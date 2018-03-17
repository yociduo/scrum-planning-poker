const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 9001;
const debug = !(process.env.PROD || false);
const log = debug ? (...args) => console.log(...args) : () => {};

if (debug) {
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/host', (req, res) => {
    res.sendFile(__dirname + '/host.html');
  });
}

// rooms dictionary
const rooms = {};

io.on('connection', (socket) => {
  log('a user connected');

  socket.on('init room', ({ stories, ...room }) => {
    log('[init room]', { stories, ...room });
    if (!rooms.hasOwnProperty(room.id)) {
      room.stories = decodeURIComponent(stories).split('\n').filter(i => i);
      room.players = [],
      room.scores = [],
      room.currentStoryIndex = -1;
      rooms[room.id] = room;
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
