"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uuid_1 = require("uuid");
const userRouter = express_1.default.Router();
exports.userRouter = userRouter;
userRouter.get("/", authMiddleware_1.initialUserRequest);
userRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password, email } = req.body;
        const user = yield db_1.default.user.findFirst({
            where: {
                email
            }
        });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }
        const comparePassword = yield bcrypt_1.default.compare(password, user.password);
        if (!comparePassword) {
            return res.json({ message: "Invalid password" });
        }
        else {
            const token = yield jsonwebtoken_1.default.sign(user.id, utils_1.JWT_SECRET_KEY);
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 3600000 });
            return res.json({ message: "Logged in successfully !!", user: user });
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        db_1.default.$disconnect();
    }
}));
userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    try {
        const findUSer = yield db_1.default.user.findMany({
            where: {
                email,
                username
            }
        });
        if (findUSer.length > 0) {
            return res.status(400).json({ message: "User already exists !!" });
        }
        const cryptedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield db_1.default.user.create({
            data: { username, password: cryptedPassword, email },
        });
        const token = jsonwebtoken_1.default.sign(user.id, utils_1.JWT_SECRET_KEY);
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 3600000 });
        return res.json({ message: "Success, signup", user: user });
    }
    catch (error) {
        console.log("error in db", error);
        return res.json({ message: "Failed, signup" });
    }
    finally {
        db_1.default.$disconnect();
    }
}));
userRouter.get("/signout", (req, res) => {
    const token = req.cookies.token;
    console.log("token backd", token);
    if (token) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
        return res.json({ message: "Success" });
    }
    else {
        return res.status(400).json({ message: "Already signout out !!" });
    }
});
userRouter.put("/update", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, imageUrl } = req.body;
        const updateUser = {};
        if (username)
            updateUser.username = username;
        if (imageUrl)
            updateUser.imageUrl = imageUrl;
        if (username || imageUrl) {
            const updatedUser = yield db_1.default.user.update({
                where: {
                    id: req.user.id
                },
                data: updateUser
            });
            return res.json({ message: "Success", user: updatedUser });
        }
        else {
            return res.json({ message: "Could not update user " });
        }
    }
    catch (error) {
        return res.status(400).json({ message: "User update failed !!" });
    }
}));
userRouter.put("/connect-with-mentor/:id", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const Id = req.params["id"];
        const mentorId = Id.split("=")[1];
        const { username, money } = req.body;
        var mentor = yield db_1.default.mentor.findUnique({
            where: { id: mentorId }
        });
        var user = yield db_1.default.user.findFirst({
            where: {
                username: username
            }
        });
        if (!user) {
            return res.status(400).json({ message: "No such user exists !!" });
        }
        const roomId = (0, uuid_1.v4)();
        const userRooms = user.roomId;
        userRooms.push(roomId);
        if (!mentor) {
            return res.status(400).json({ message: "Mentor does not exist !!" });
        }
        const mentorRooms = mentor.roomId;
        mentorRooms.push(roomId);
        //! change this 
        // else if(mentor){
        //     if(mentor.price !== money){
        //         return res.status(400).json({message:"Please enter appropriate amount !!"})
        //     }
        //     mentorRooms.push(roomId);
        // }
        mentor = yield db_1.default.mentor.update({
            where: { id: mentorId },
            data: {
                roomId: mentorRooms,
                usersName: { push: username },
                userMentored: { increment: 1 }
            }
        });
        console.log("updated mentor", mentor);
        user = yield db_1.default.user.update({
            where: { username: username },
            data: {
                username: username,
                roomId: userRooms,
                mentorName: { push: mentor.username }
            }
        });
        console.log("updated user", user);
        return res.json({ message: "success", roomId: roomId, user: user, mentor: mentor });
    }
    catch (error) {
        console.log(error);
    }
}));
