const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser, getUsersInRoom } = require('./utils/users')
const PORT = process.env.PORT || 3000

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

app.use(express.static(path.join(__dirname, "../public/chat.html")))

io.on('connection', (socket) => {


    //room
    socket.on('join', ({ username, room }, ack_cb) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        //if user already exists
        if (error) {
            return ack_cb(false);
        }

        //if user with the new name doesn't exists
        ack_cb(true);

        //joining the room
        socket.join(user.room);


        //emit the welcome message to me only
        socket.emit('message', generateMessage(`Welcome! ${user.username}`, user.username));

        //sends message to all OTHER clients in room
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} joined!`));

        //custom event checks if the sendMessage even has triggered
        socket.on("sendMessage", ({ message, current_user }, ack_cb) => {

            //profanation - bad words
            const filter = new Filter();
            if (filter.isProfane(message)) {
                return ack_cb('profanity not allowed!');
            }

            //sending data to all the users in the room including me
            io.to(user.room).emit('message', generateMessage(message, current_user));

            ack_cb('Message delivered!');
        })

        //send location to all users in the room
        socket.on('sendLocation', (cords, ack_cb) => {
            const url = `https://google.com/maps?q=${encodeURIComponent(cords.latitude)},${encodeURIComponent(cords.longitude)}`;
            io.to(room).emit('locationMessage', generateLocationMessage(url, username))
            ack_cb("Location sent!")
        })

        //event provided by socket.io sending left message to everyone in room
        socket.on('disconnect', () => {

            const someUser = removeUser(socket.id);
            
            if (someUser.error) {
                return "some error occurred!";
            }
            //emit message to everyone that user has left
            io.to(someUser.room).emit('message', generateMessage(`${someUser.username} left!`))
            //emit the array of all the user after removal of currently left to the event on client side to complete array of current users
            io.to(someUser.room).emit('leftSomeOne', getUsersInRoom(someUser.room));

        })
        //to sent the array of all the users after joining somebody new in order to show in users list
        io.to(user.room).emit('joinedSomeOne', getUsersInRoom(user.room));

    })

})

server.listen(PORT, () => {
    console.log(`server is up on port ${PORT}`)
})