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
exports.initialUserRequest = exports.initialMentorRequest = exports.authMentorMiddleware = exports.authMiddleware = void 0;
const db_1 = __importDefault(require("../db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        console.log("Token", token);
        if (!token) {
            return res.json({ message: "Please sign in !!" });
        }
        const userID = jsonwebtoken_1.default.verify(token, utils_1.JWT_SECRET_KEY);
        // const user  = await prisma.user.findFirst({
        //     where:{
        //         id:userID as string
        //     }
        // })
        req.user = userID;
        // console.log("User",userID);
        // console.log("Authmiddelware cookie",token);
        next();
    }
    catch (error) {
        console.log("in middlw", error);
    }
});
exports.authMiddleware = authMiddleware;
const authMentorMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        console.log("Token", token);
        if (!token) {
            return res.json({ message: "Please sign in !!" });
        }
        const userID = jsonwebtoken_1.default.verify(token, utils_1.JWT_SECRET_KEY);
        // const user  = await prisma.mentor.findFirst({
        //     where:{
        //         id:userID as string
        //     }
        // })
        console.log("USERID", userID);
        req.user = userID;
        console.log("Mentor", userID);
        console.log("Authmiddelware cookie", token);
        next();
    }
    catch (error) {
        console.log("in mentor middw.", error);
    }
});
exports.authMentorMiddleware = authMentorMiddleware;
const initialUserRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        console.log("Token", token);
        if (!token) {
            return res.json({ message: "Please sign in !!" });
        }
        const userID = jsonwebtoken_1.default.verify(token, utils_1.JWT_SECRET_KEY);
        if (!userID) {
            return res.status(400).json({ message: "No userID exists !!" });
        }
        const user = yield db_1.default.user.findFirst({
            where: {
                id: userID
            }
        });
        if (!user) {
            return res.status(400).json({ message: "No user exists !!" });
        }
        console.log("User", user);
        return res.json({ message: "success", user: user });
    }
    catch (error) {
        console.log("in middlw", error);
        return res.json({ message: "No user exists !!" });
    }
});
exports.initialUserRequest = initialUserRequest;
const initialMentorRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        console.log("Token", token);
        if (!token) {
            return res.json({ message: "Please sign in !!" });
        }
        const userID = jsonwebtoken_1.default.verify(token, utils_1.JWT_SECRET_KEY);
        const user = yield db_1.default.mentor.findFirst({
            where: {
                id: userID
            }
        });
        if (!user) {
            return res.status(400).json({ message: "No mentor exists !!" });
        }
        return res.json({ message: "success", user: user });
    }
    catch (error) {
        console.log("in mentor middw.", error);
        return res.json({ message: "No mentor exists !!" });
    }
});
exports.initialMentorRequest = initialMentorRequest;
