var express = require('express');
var  app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var users = {};
var connections = [];
var privaeRooms = {}

var port = process.env.PORT || 3000

server.listen(port)
console.log('servering running on ' + '' + `${port}` );

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/index.html')
})

io.sockets.on('connection', function(socket) {
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  // Disconnect
  socket.on('disconnect', function(data){
    delete users[socket.username]
    // users.splice(users.indexOf(socket.username), 1)
    updateUsernames();
    // connections.splice(connections.indexOf(socket), 1);
    // console.log('Disconnected: %s sockets connected', connections.length);
  });

  // Send Message
  socket.on('send message', function(data, callback){
    var message = data.trim()
    if(message.substr(0,3) === '/w ') {
      message = message.substr(3);
      var ind = message.indexOf(' ');
      if(ind !== -1) {
        var name = message.substr(0, ind);
        var message = message.substr(ind + 1)
        if(name in users) {
          users[name].emit('whisper',
           {
            msg: message,
            user: socket.username
          })
          console.log('whisper!');
        } else {
          callback('Error! Enter a valid user.')
        }
      } else {
        callback('Error! Please enter a message for your whisper.')
        }
      } else {
    io.sockets.emit('new message', {msg: message, user: socket.username
    })
    }
  })

  socket.on('send private message', function(data, callback){
    var message = data.trim()
    io.sockets.emit('new private message', {msg: message, user: socket.username
    })
  })


  // new user & handlebars uname
  socket.on('new user', function(data, callback) {
    if(data in users) {
      callback(false)
    } else {
    callback(true);
    socket.username = data;
    users[socket.username] = socket;
    updateUsernames()
    }
  });

  function updateUsernames() {
    io.sockets.emit('get users', Object.keys(users));
  }

  socket.on('private', function(data){
    console.log(data);
    if(data.users[0] != '' && data.users[1] != '') {
      var roomName = data.users.join('_')
      // console.log(roomName, data);
      socket.join(roomName)
      console.log(roomName);
      users[data.users[1]].join(roomName)
      io.in(roomName).emit('privateRoom', data)
    }
  })

})
