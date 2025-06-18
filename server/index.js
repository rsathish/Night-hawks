const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let rooms = {}; // key: roomId, value: [player sockets]

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    rooms[roomId] = [socket.id];
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    console.log(`Room ${roomId} created`);
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId] && rooms[roomId].length < 5) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      io.to(roomId).emit('playerJoined', rooms[roomId]);
    } else {
      socket.emit('roomError', 'Room full or not found');
    }
  });

  socket.on('rollDice', ({ roomId }) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    io.to(roomId).emit('diceRolled', { player: socket.id, roll });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
