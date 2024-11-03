"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.bigusers = [];
        this.bigqueue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        const findSID = this.queue.find(id => id === socket.id);
        if (findSID) {
            console.log("User already exists ");
            return;
        }
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        //! emit something
        this.clearQueue();
        this.handleOffer(socket);
    }
    addBigUser(name, socket, university) {
        const findSID = this.queue.find(id => id === socket.id);
        if (findSID) {
            console.log("User already exists ");
            return;
        }
        this.bigusers.push({ name, socket, university });
        this.bigqueue.push(socket.id);
        this.clearBigUser();
        this.handleOffer(socket);
    }
    clearBigUser() {
        if (this.bigqueue.length < 2) {
            return; // Not enough users to connect
        }
        // const person1Id = this.bigqueue.pop(); 
        const person1Id = this.bigqueue[this.bigqueue.length - 1];
        const user1Index = this.bigusers.findIndex(user => user.socket.id === person1Id);
        if (user1Index === -1) {
            return; // Person not found in bigusers
        }
        const user1 = this.bigusers[user1Index];
        // Find a second user with the same university
        const findPerson = this.bigusers.find(user => user.socket.id !== user1.socket.id && user.university === user1.university);
        if (!findPerson) {
            console.log("No matching user found or self-match.");
            return; // No matching user found
        }
        this.bigusers.splice(user1Index, 1); //remove old user 
        this.bigusers.splice(Number(findPerson.socket.id), 1); //remove new user 
        this.bigqueue = this.bigqueue.filter(id => id !== user1.socket.id); // Remove latest user from bigqueue
        this.bigqueue = this.bigqueue.filter(id => id !== findPerson.socket.id); // Remove latest user from bigqueue
        // Ensure both users are valid
        if (user1 && findPerson) {
            const finalUser1 = { name: user1.name, socket: user1.socket };
            const finalUser2 = { name: findPerson.name, socket: findPerson.socket };
            console.log("not normal users connecting:", finalUser1.name, "user2 connecting:", finalUser2.name);
            const room = this.roomManager.createRoom({ user1: finalUser1, user2: finalUser2 });
            this.onChatting(finalUser1, finalUser2, room); // Start chatting
        }
    }
    clearQueue() {
        if (this.queue.length < 2) {
            return;
        }
        const person1 = this.queue.pop();
        const person2 = this.queue.pop();
        // Find the corresponding users in the users array
        const user1Index = this.users.findIndex(user => user.socket.id === person1);
        const user2Index = this.users.findIndex(user => user.socket.id === person2);
        // Ensure both users exist before proceeding
        if (user1Index === -1 || user2Index === -1) {
            return;
        }
        const user1 = this.users[user1Index];
        const user2 = this.users[user2Index];
        // Remove user1 and user2 from the users array
        this.users.splice(user1Index, 1);
        this.users.splice(user2Index, 1);
        // Create a room for the users and start their chat
        const room = this.roomManager.createRoom({ user1, user2 });
        console.log("Connected to Room", room);
        this.onChatting(user1, user2, room);
    }
    onChatting(user1, user2, room) {
        console.log("when sedning messages or receing");
        user1.socket.join(room);
        user2.socket.join(room);
        user1.socket.on("send-message", (text) => {
            console.log("Sendign message ", text);
            user2.socket.emit("receive-message", text);
        });
    }
    handleOffer(socket) {
        socket.on("offer", ({ sdp, roomId }) => {
            //    console.log("Calling - SDP",sdp);
            this.roomManager.onOffering(sdp, roomId, socket.id);
        });
        socket.on("answer", ({ sdp, roomId }) => {
            //console.log("Answering user -> SDP",sdp);
            this.roomManager.onAnswer(sdp, roomId, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            // console.log("Ice running in backend");          
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
    }
    removeUser(socketId) {
        const bigUserIndex = this.bigusers.findIndex(user => user.socket.id === socketId);
        if (bigUserIndex !== -1) {
            this.bigusers.splice(bigUserIndex, 1);
            this.bigqueue = this.bigqueue.filter(id => id !== socketId);
            return { userType: 'bigUser' };
        }
        const userIndex = this.users.findIndex(user => user.socket.id === socketId);
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
            this.queue = this.queue.filter(id => id !== socketId);
            return { userType: 'normalUser' };
        }
        return { userType: null };
    }
    returnMapData() {
        return {
            universityStudents: this.bigusers.map((_a) => {
                var { socket } = _a, rest = __rest(_a, ["socket"]);
                return rest;
            }),
            universityStudentsId: this.bigqueue,
            normalUsers: this.users.map((_a) => {
                var { socket } = _a, rest = __rest(_a, ["socket"]);
                return rest;
            }),
            normalUsersId: this.queue
        };
    }
}
exports.UserManager = UserManager;
