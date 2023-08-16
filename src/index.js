const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const  { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

// express static middleware to sever the public dir files
app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    // socket.emit('message', generateMessage('Welcome'));
    // socket.broadcast.emit('message', generateMessage('A new user has joined'));

    // socket.on('join', ({ username, room }, callback) => {
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id:socket.id, ...options });
        // const { error, user } = addUser({ id:socket.id, username, room });

        if(error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin','Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        // socket.emit('message', generateMessage('Welcome'));
        // socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));

        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback();
        // Socket.emit,  IO.emit,  Socket.broadcast.emit
        // iO.to.emit ,   Socket.broadcast.to.emit
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        // io.emit('message', generateMessage(message));
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
        // callback('Delivered');
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);

        // io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`);
        // io.emit('message', `http://google.com/maps?g=${coords.latitude},${coords.longitude}`);
        // io.emit('locationMessage', generateLocationMessage(`http://google.com/maps?g=${coords.latitude},${coords.longitude}`));
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`http://google.com/maps?g=${coords.latitude},${coords.longitude}`));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }  
    })
})



/*
let count = 0;
// server (emit) -> client (receive) -> countUpdated
// client (emit) -> server (receive) -> increament
io.on('connection', (socket) => {
    console.log('New WebSocket Connection');
    socket.emit('countUpdated', count);
    socket.on('increament', () => {
        count++;
        //This one emits an event to that specific connection.
        // socket.emit('countUpdated', count); 

        // This one emits the event to every single connection.
        io.emit('countUpdated', count);
    })
})
*/


server.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})




/*
Weather App : create a button that will get the current location weather

ToDo App : allow user to add image in their tasks, like bill screenshot of their task

chat App : Let users pick from list of active rooms or type in custom room name

*/