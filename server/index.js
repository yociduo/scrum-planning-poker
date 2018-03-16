const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.set('origins', '*:*');

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.broadcast.emit('hi');
  socket.on('chat message', function (msg) {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

http.listen(9001, function () {
  console.log('listening on *:9001');
});
