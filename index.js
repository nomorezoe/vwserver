const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { instrument } = require("@socket.io/admin-ui");
const Room = require('./room');
const Player = require('./player');

app.all("/", function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  return next();
});

let rooms = {};
let players = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  if(getActiveRooms().length == 0){
    console.log("createroom");
    var room = new Room("room1");
    rooms["room1"] = room;
    onPlayerJoinedRoom(socket, "room1");
  }
  else{
    onPlayerJoinedRoom(socket, "room1");
  }


  socket.on("disconnect", (reason)=>{
    console.log("a user left");
    onPlayerLeftRoom(socket, "room1");
  })

  socket.on("updatePosition", (pos)=>{
    onUpdatePosition(socket, pos)
  })

  socket.on("spawn", (info)=>{
    onSpawn(socket, info)
  })

  socket.on("chat", (text) =>{
    onChatReceived(socket, text);
  })

});

instrument(io, {
    auth:false
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});


function getActiveRooms() {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter(room => !room[1].has(room[0]))
  // Return only the room name: 
  // ==> ['room1', 'room2']
  const res = filtered.map(i => i[0]);
  return res;
}

function onPlayerJoinedRoom(socket, roomid){
  socket.join(roomid);
  players[socket.id] = new Player(socket.id);

  let playerInfo = {};
  io.sockets.adapter.rooms.get(roomid).forEach(function(value){
    if(value != socket.id){
      io.of('/').sockets.get(value).emit("playerJoined", socket.id);
      playerInfo[value] = players[value].getInfo();
    }
  })
  socket.emit("roomJoined", playerInfo);
}

function onPlayerLeftRoom(socket, roomid){
 
  delete players[socket.id];

  if(!io.sockets.adapter.rooms.get(roomid)){
    delete rooms[roomid];
    return;
  }
  io.sockets.adapter.rooms.get(roomid).forEach(function(value){
    if(value != socket.id){
      io.of('/').sockets.get(value).emit("playerLeft", socket.id);
    }
  })
}

function onSpawn(socket,info){
  if(!players[socket.id]){
    return;
  }
  players[socket.id].updateSign(info.sign);
  players[socket.id].updatePosition(info.pos);
  players[socket.id].updateAvatarKey(info.avatarKey);
  io.sockets.adapter.rooms.get("room1").forEach(function(value){
    if(value != socket.id){
      io.of('/').sockets.get(value).emit("playerSpawn", socket.id, players[socket.id].getInfo());
    }
  })
}

function onUpdatePosition(socket, pos){
  if(!players[socket.id]){
    return;
  }
  players[socket.id].updatePosition(pos);
  io.sockets.adapter.rooms.get("room1").forEach(function(value){
    if(value != socket.id){
      io.of('/').sockets.get(value).emit("updateOthersPosition", socket.id, pos);
    }
  })
}

function onChatReceived(socket, text){
  if(!players[socket.id]){
    return;
  }
  
  io.sockets.adapter.rooms.get("room1").forEach(function(value){
    if(value != socket.id){
      io.of('/').sockets.get(value).emit("chat", socket.id, text);
    }
  })
}