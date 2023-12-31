const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true });


const autoscroll = () => {
    // New Message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far I have scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight - 1 <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    // $messages.scrollTop = $messages.scrollHeight
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username : message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    // console.log(room);
    // console.log(users);
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // disable button 
    $messageFormButton.setAttribute('disabled','disabled');

    // const message = document.querySelector('input').value;    //OR
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // enable button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error);
        }

        console.log('Message delivered!');
    });
    // socket.emit('sendMessage', message, (message) => {
    //     console.log('The message was delivered', message);
    // });
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    // disabled button
    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position);
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log("Location shared!");
        });
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});


/*
socket.on('countUpdated', (count) => {
    console.log('Count has been updated!', count);
})

document.querySelector('#increament').addEventListener('click', () => {
    console.log("clicked");

    socket.emit('increament');
})
*/