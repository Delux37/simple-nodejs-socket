// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server);

const chat = [];
let onlineUsers = 0;
const connectedUserIds = [];

io.on('connection', (socket) => {
  connectedUserIds.push(socket.id);
  onlineUsers++;

  io.to(socket.id).emit('chat message', generateHistory(socket.id));

  socket.on('disconnect', () => {
    console.log('user disconnected');
    onlineUsers--;
    connectedUserIds.splice(connectedUserIds.indexOf(socket.id), 1);
  });

  // When a user sends a message
  socket.on('chat message', ({ message, username }) => {
    const messageObj = {
      userId: socket.id,
      message,
      username
    };

    chat.push(messageObj);

    connectedUserIds.forEach((socketId) => {
      io.to(socketId).emit('chat message', generateHistory(socketId));
    });
  });
});

app.get('/online-users', (req, res) => {
  res.json(onlineUsers);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

function generateHistory(userId, param) {
  const history = chat.map((message) => {
    if (userId && message.userId === userId) {
      return {
        isReceived: false,
        message: message.message,
        senderName: message.username,
        param
      };
    }

    return {
      message: message.message,
      isReceived: connectedUserIds.includes(message.userId),
      senderName: message.username,
      param
    };
  });

  return history;
}
