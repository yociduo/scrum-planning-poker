const express = require('express');
var app = express();
const fs = require('fs');
const kraken = require('kraken-js');
var bodyParser = require('body-parser');

var sio = require('./lib/room-socket');
const http = require('http');

app.use(bodyParser.json({limit: '200mb'}));

app.on('start', function () {
    
    console.log('Application ready to serve requests.');
    console.log('Environment: %s', app.kraken.get('env:env'));
});


let server;
server = http.createServer(app);
sio.init(server);
global.PATH = __dirname;

server.listen(process.env.PORT || 9001);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});