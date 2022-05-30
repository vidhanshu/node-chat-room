const socket = io();

/* elements */
const $form = document.querySelector('form');
const $text = document.getElementById('text');
const $send_btn = $form.elements.send;
const $send_loc_btn = document.querySelector("#send-location");
const $userListBtn = document.querySelector("#users-btn");
$text.focus();

/* templates */
const $messagesTemplate = document.querySelector("#message-template").innerHTML;
const $messagesTemplateOtherUser = document.querySelector("#message-template-other").innerHTML;
const $userTemplate = document.querySelector("#user-template").innerHTML;
const $linkTemplate = document.querySelector("#link-template").innerHTML;
const $messageContainer = document.querySelector("#messages");
const $userListContainer = document.querySelector("#users-list");
const $left = document.querySelector(".left");
const $roomName = document.querySelector("#room-name");

/* ****************just for responsiveness************************* */
$userListBtn.addEventListener('click', () => {
    if ($left.style.display === 'none' || $left.style.display === '') {
        $left.style.display = 'block'
    } else {
        $left.style.display = 'none'
    }
})

window.onresize = () => {
    if (window.innerWidth >= "701") {
        $left.style.display = 'flex';
    } else {
        $left.style.display = 'none';
    }
}
/* ****************just for responsiveness************************* */


const autoScroll = () => {
    /* new message element */
    const $newMessage = $messageContainer.lastElementChild;
    /* height of the new message */
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessageMargin + $newMessage.offsetHeight;

    const visibleHeight = $messageContainer.offsetHeight

    const containerHeight = $messageContainer.scrollHeight

    const scrollOffset = $messageContainer.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageContainer.scrollTop = $messageContainer.scrollHeight;
    }
}

/* options */
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

/* setting up the room name */
$roomName.innerHTML = "Room name: " + room

/* get message send by somebody else */
socket.on('message', (messageObj) => {

    let html;

    if (messageObj.user === username) {
        html = Mustache.render($messagesTemplate, {
            data: messageObj.text,
            createdAt: moment(messageObj.createdAt).format('h:mm A'),
            username: messageObj.user,
            room
        })
    } else {
        html = Mustache.render($messagesTemplateOtherUser, {
            data: messageObj.text,
            createdAt: moment(messageObj.createdAt).format('h:mm A'),
            username: messageObj.user,
            room
        })
    }

    $messageContainer.insertAdjacentHTML("beforeend", html);
    autoScroll();
})


socket.on('locationMessage', (locationObj) => {
    const html = Mustache.render($linkTemplate, {
        url: locationObj.url,
        createdAt: moment(locationObj.createdAt).format("h:mm A"),
        username: locationObj.user,
        room
    })
    $messageContainer.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

$form.addEventListener('submit', (evt => {
    evt.preventDefault();
    const value = $text.value;
    if (value.trim() == '') {
        return alert('Please enter a message!');
    }

    //you are sending message to everyone in the room
    socket.emit('sendMessage', { message: value, current_user: username }, (acknowledgement) => {
        if (acknowledgement[0] == 'p') {
            return alert(acknowledgement);
        }
        console.log(acknowledgement)
    });

    $text.value = "";
    $text.focus();
}))


$send_loc_btn.addEventListener('click', () => {
    $send_loc_btn.disabled = true;
    if (!navigator.geolocation) {
        return alert('geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { longitude: position.coords.longitude, latitude: position.coords.latitude }, (ack) => {
            console.log(ack);
            $send_loc_btn.disabled = false;
        });
    })
})

socket.emit('join', { username, room }, (ack) => {
    if (!ack) {
        alert('user with this name already exists!');
        window.location.href = "/";
    }
});


/* to display users list */
socket.on('joinedSomeOne', (object) => {
    const allHTML = object.map(({ username, joinedAt }) => {
        return Mustache.render($userTemplate, {
            username,
            joinedAt: moment(joinedAt).format('h:mm A'),
        })
    })
    let html = '';
    allHTML.map(e => {
        html += e;
    })
    $userListContainer.innerHTML = html;
})

socket.on('leftSomeOne', (object) => {
    const allHTML = object.map(({ username, joinedAt }) => {
        return Mustache.render($userTemplate, {
            username,
            joinedAt: moment(joinedAt).format('h:mm A'),
        })
    })
    let html = '';
    allHTML.map(e => {
        html += e;
    })
    $userListContainer.innerHTML = html;
})
/* to display users list */



/* share on whats app */
document.querySelector("#shareable-link").setAttribute('href', `whatsapp://send?text=${location.origin} \nuse the room code - ${room} \nJoin the room and let's have some fun 😉`);
