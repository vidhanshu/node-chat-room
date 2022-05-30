const users = [];
const roomSet = new Set();
//addUser ,removeUser,getUsr,getUsersInRoom


const addUser = ({ id, username, room }) => {
    //sanitizing the data
    username = username.trim().toLowerCase();
    room = room ? room.trim() : NULL;

    //checking if fields are not provided
    if (!username || !room) {
        return {
            error: 'username and room name are required!'
        }
    }

    //checking if user already exists
    const existingUser = users.find((user) => {
        return user.room === room && user.username == username
    })

    //if exists
    if (existingUser) {
        return {
            error: "user with this username already exists!"
        }
    }
    //if not exists
    const user = { id, username, room, joinedAt: new Date().getTime() };
    users.push(user);

    return { user };
}

const removeUser = (id) => {
    //check if exists
    const index = users.findIndex((user) => user.id === id)


    //if not exists
    if (index === undefined) {
        return {
            error: "user with this id doesn't exists!"
        }
    }

    //if exists
    return users.splice(index, 1)[0]
}


const getUsersInRoom = (room) => {
    room = room.trim();
    return users.filter((user) => user.room === room)
}

const insertRoom = (room) => {
    roomSet.add(room)
}

const howManyUsersInARoom = (room) => {
    let count = users.filter(e => {
        e.room === room;
    })
    return count.length;
}

const removeRoom = (room) => {
    roomSet.delete(room)
}

const getAllRooms = () => {
    let rooms = [];
    roomSet.forEach(e => {
        rooms.push(e);
    })
    return rooms;
}
module.exports = {
    addUser,
    getUsersInRoom,
    removeUser,
    removeRoom,
    howManyUsersInARoom,
    insertRoom,
    getAllRooms
}