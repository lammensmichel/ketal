const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  'http://localhost:3000', // serveur Node.js
  'http://localhost:4200', // app angular
  'http://example.com',
  'https://example.com',
  'http://192.168.0.100'
];
app.use(cors({
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
const server = http.createServer(app);
// Passer les options CORS à l'initialisation de Socket.IO
const socketIoOptions = {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  }
};

// Initialisez Socket.IO avec les options
const io = socketIo(server, socketIoOptions);


let rooms = [];

io.on('connection', (socket) => {
  socket.emit('rooms', rooms);

  socket.on('delete-room', (roomDeleted) => {
    console.log('delete-room', roomDeleted);
    rooms = rooms.filter((room) => room.id !== roomDeleted.id);
    io.emit('rooms', rooms);
  });

  socket.on('create-room', (room) => {
    console.log('create-room', room);
    rooms.push(room);
    io.emit('rooms', rooms);
  });

  socket.on('join-room', (roomName) => {
    console.log('join-room', roomName);
    // Vérifiez si le salon existe
    const room = rooms.find((r) => r.id === roomName.id);
    if (room) {
      // Vous pouvez également émettre un événement pour confirmer que l'utilisateur a rejoint le salon
      socket.emit('room-joined', roomName);
    } else {
      // Salon inexistant, vous pouvez émettre un message d'erreur ou effectuer une autre action
      socket.emit('room-not-found', roomName);
    }
  });

});

server.listen(3000, () => {
  console.log(`Serveur en cours d'exécution sur le port 3000`);
});
