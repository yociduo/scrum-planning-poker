var SIO = {
    init: function (server) {
        let vm = this;
       console.log('init sio');
        this.io = require('socket.io')(server);
        this.io.set('origins', '*:*');
        this.io.on('connection', function(socket) {

            socket.on('message', function(obj) {
                console.log('nickname: +++++', obj);
                var obj_copy = Object.assign({}, obj);
                obj_copy.createdAt = new Date();
                socket.broadcast.emit('message broadcast', obj_copy);
            })

            socket.on('disconnect', (res) => {
                console.log('user disconnect');  
            })
        })
    } 
}

module.exports = SIO;