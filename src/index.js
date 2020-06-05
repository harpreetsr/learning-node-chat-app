const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require('bad-words') 
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
 
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
 
app.use(express.static(publicDirectoryPath));
 
let count = 0

io.on("connection", (socket) => { 
    console.log(' New connection join')

    socket.on('join', (options, callback) => {
      const {user, error} = addUser({id:socket.id, ...options})

      if(error){
        return callback(error)
      }
      socket.join(user.room)

      socket.emit('message', generateMessage('Welcome!', 'Admin'))
      socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`, 'Admin'))

      io.to(user.room).emit('roomData', {
        room:user.room,
        users:getUsersInRoom(user.room)
      })

      callback()
    })

    socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id)
      const filter = new Filter()

        if(filter.isProfane(message)){
           return callback(generateMessage('Profanity is not allowed!'))
        }

        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
      const user = getUser(socket.id)

      io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`, user.username))
      callback('Succefully!')
    })

    socket.on('disconnect', () => {
      const user = removeUser(socket.id)
      if(user){
        io.to(user.room).emit('message', generateMessage(`${user.username} has left`, 'Admin'))
        io.to(user.room).emit('roomData', {
          room:user.room,
          users:getUsersInRoom(user.room)
        })
      }
    })

});
 
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});