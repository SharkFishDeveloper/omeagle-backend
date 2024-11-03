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
exports.mentorRouter = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../utils");
const bcrypt_1 = __importDefault(require("bcrypt"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const mentorRouter = express_1.default.Router();
exports.mentorRouter = mentorRouter;
mentorRouter.get("/", authMiddleware_1.initialMentorRequest);
mentorRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password, email } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const user = yield db_1.default.mentor.findUnique({
            where: {
                email
            }
        });
        if (!user) {
            return res.json({ message: "User does not exist" });
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
mentorRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    try {
        const findUSer = yield db_1.default.mentor.findMany({
            where: {
                email,
                username
            }
        });
        if (findUSer.length > 0) {
            return res.status(400).json({ message: "User already exists !!" });
        }
        const cryptedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield db_1.default.mentor.create({
            data: { username, password: cryptedPassword, email },
        });
        const token = yield jsonwebtoken_1.default.sign(user.id, utils_1.JWT_SECRET_KEY);
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
mentorRouter.post("/search", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username: searchname, selectedTags: specializations, university } = req.body;
        if (!searchname && !(specializations === null || specializations === void 0 ? void 0 : specializations.length) && !university) {
            return res.status(303).json({ message: "No search criteria provided!" });
        }
        console.log("USERNAME", searchname, specializations, university);
        const whereConditions = {};
        if (searchname) {
            whereConditions.username = { contains: searchname, mode: 'insensitive', };
        }
        if (specializations && specializations.length > 0) {
            whereConditions.specializations = { hasEvery: specializations };
        }
        if (university) {
            whereConditions.university = { contains: university, mode: 'insensitive', };
        }
        const users = yield db_1.default.mentor.findMany({
            where: whereConditions,
            take: 10, // Limit the results to the best matching 10 mentors
        });
        console.log("mentor users");
        return res.json({ message: `success`, users: users });
    }
    catch (error) {
        console.log("errro in fiding user", error);
    }
}));
mentorRouter.get(`/:id`, authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mentorID = req.params.id;
        const mentorPara = mentorID.split("=")[1];
        console.log("her", mentorID);
        const user = yield db_1.default.mentor.findUnique({
            where: {
                id: mentorPara
            }
        });
        if (!user) {
            return res.status(400).json({ message: "No mentor found" });
        }
        else {
            return res.json({ message: user });
        }
    }
    catch (error) {
        console.log(error);
        res.status(403).json({ message: "No mentor found", error: error });
    }
    finally {
        db_1.default.$disconnect();
    }
}));
mentorRouter.put("/update", authMiddleware_1.authMentorMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { price, username, imageUrl, university, specializations, timeslots } = req.body;
        const mentorDataToUpdate = {};
        if (username)
            mentorDataToUpdate.username = username;
        if (imageUrl)
            mentorDataToUpdate.imageUrl = imageUrl;
        if (university)
            mentorDataToUpdate.university = university;
        if (specializations) {
            mentorDataToUpdate.specializations = specializations.map(specialization => specialization.trim()).filter(specialization => specialization.length > 0);
        }
        if (specializations)
            mentorDataToUpdate.price = price;
        if (timeslots) {
            timeslots.sort((a, b) => a - b);
            for (let i = 0; i < timeslots.length; i++) {
                if (timeslots[i] - timeslots[i - 1] <= 1) {
                    return res.status(300).json({ message: "Time slots are too close. Keep difference of atleast 2 !!" });
                }
            }
            mentorDataToUpdate.timeslots = timeslots;
        }
        ;
        console.log("UPDATE DATA", mentorDataToUpdate);
        const userId = req.user;
        const userUpdated = yield db_1.default.mentor.update({
            where: {
                id: userId
            },
            data: mentorDataToUpdate
        });
        console.log(userUpdated);
        return res.json({ message: "Success", user: userUpdated });
    }
    catch (error) {
        console.log("Mentor update error", error);
        return res.status(405).json({ message: "Mentor update failed !!" });
    }
}));
