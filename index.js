const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const session = require('express-session');
const { useRoutes } = require('./routes');
const database = require('./database');

const app = express();
const port = process.env.PORT || 3003;

const server = app.listen(port, () =>
  console.log('Server listening on port ' + port)
);
const io = require('socket.io')(server, { pingTimeOut: 60000 });
//config
app.use(
  session({
    secret: 'bbq chips',
    resave: true,
    saveUninitialized: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', 'views');
useRoutes(app);

//socket.io
io.on('connection', (socket) => {
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });
  socket.on('join room', (room) => socket.join(room));
  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));
  socket.on('notification received', (room) =>
    socket.in(room).emit('notification received')
  );

  socket.on('new message', (newMessage) => {
    const chat = newMessage.chat;
    if (!chat?.users) return console.log('Chat.users not defined');
    chat.users.forEach((user) => {
      if (user._id == newMessage.sender._id) return;
      socket.in(user._id).emit('message received', newMessage);
    });
  });
});
