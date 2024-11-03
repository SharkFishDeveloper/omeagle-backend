"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const UserManager_1 = require("./managers/UserManager");
const userRouter_1 = require("./routes/userRouter");
const mentorRouter_1 = require("./routes/mentorRouter");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true
}));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*"
    }
});
const userManager = new UserManager_1.UserManager();
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ name, university }) => {
        console.log("University ", university);
        if (university && university.trim() !== "") {
            console.log("Universty", university);
            //! main CRUX
            userManager.addBigUser(name, socket, university);
        }
        else {
            //! main CRUX
            userManager.addUser(name, socket);
            console.log("Totally random", name);
        }
    });
    // Listen for messages from the client
    socket.on('send-message', (message) => {
        // console.log('Message from client:', message);
        socket.broadcast.emit("receive-message", message);
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        const { userType } = userManager.removeUser(socket.id);
        if (userType === 'bigUser') {
            console.log(`User with university disconnected: ${socket.id}`);
        }
        else if (userType === 'normalUser') {
            console.log(`Regular user disconnected: ${socket.id}`);
        }
        else {
            console.log(`Unknown user disconnected: ${socket.id}`);
        }
    });
});
app.use("/app/user", userRouter_1.userRouter);
app.use("/app/mentor", mentorRouter_1.mentorRouter);
app.get("/data", (req, res) => {
    return res.json({ "All data of map": userManager.returnMapData() });
});
server.listen(3000, () => {
    console.log("Server running 3000");
});
