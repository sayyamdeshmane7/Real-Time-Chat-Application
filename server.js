const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Store active users and rooms
const users = {};
const rooms = ['General', 'Technology', 'Gaming'];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };
    
    // Notify others in the room
    socket.to(room).emit('message', {
      username: 'System',
      text: `${username} has joined the room`,
      time: new Date().toLocaleTimeString()
    });
    
    // Send room users info
    io.to(room).emit('roomUsers', {
      room,
      users: getUsersInRoom(room)
    });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.room).emit('typing', {
      username: data.username,
      isTyping: data.isTyping
    });
  });

  // Handle chat messages
  socket.on('sendMessage', (data) => {
    io.to(data.room).emit('message', {
      username: data.username,
      text: data.text,
      time: new Date().toLocaleTimeString()
    });
    
    // Stop typing indicator after sending message
    socket.to(data.room).emit('typing', {
      username: data.username,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const { username, room } = user;
      socket.to(room).emit('message', {
        username: 'System',
        text: `${username} has left the room`,
        time: new Date().toLocaleTimeString()
      });
      
      delete users[socket.id];
      
      io.to(room).emit('roomUsers', {
        room,
        users: getUsersInRoom(room)
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

function getUsersInRoom(room) {
  return Object.values(users)
    .filter(user => user.room === room)
    .map(user => user.username);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));