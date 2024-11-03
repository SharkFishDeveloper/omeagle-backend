import express from "express";
import prisma from "../db";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../utils";
import bcrypt from "bcrypt";
import { CustomRequest, authMiddleware, initialUserRequest } from "../middleware/authMiddleware";
import { v4 as uuidv4 } from 'uuid';
//! add zod for signup and login for both mentor and user


interface UserUpdate {
    username?:string,
    imageUrl?:string
}

const userRouter = express.Router();


userRouter.get("/",initialUserRequest);


userRouter.post("/login",async(req,res)=>{
    try {
        const {password,email} = req.body;
    const user = await prisma.user.findFirst({
        where:{
            email
        }
    })
    if(!user){return res.status(400).json({message:"User does not exist"})}
        const comparePassword = await bcrypt.compare(password,user.password);
    if(!comparePassword){
        return res.json({message:"Invalid password"})
    }else{
        const token = await jwt.sign(user.id,JWT_SECRET_KEY);
        res.cookie('token',token,{httpOnly:true,secure:true,sameSite:"none",maxAge:3600000})
        return res.json({message:"Logged in successfully !!",user:user})
    }
    } catch (error) {
     console.log(error);   
    }
    finally{
        prisma.$disconnect();
    }
})

userRouter.post("/signup",async(req,res)=>{
    const {username,password,email} = req.body;
    try {
        const findUSer = await prisma.user.findMany({
            where:{
                email,
                username
            }
        })
        if(findUSer.length > 0){
            return res.status(400).json({message:"User already exists !!"})
        }
        const cryptedPassword =await bcrypt.hash(password,10);
        const user = await prisma.user.create({
            data:{username,password:cryptedPassword,email},
        })
        const token =  jwt.sign(user.id,JWT_SECRET_KEY);
        res.cookie('token',token,{httpOnly:true,secure:true,sameSite:"none",maxAge:3600000})
        return res.json({message:"Success, signup",user:user})
    } catch (error) {
        console.log("error in db",error);
        return res.json({message:"Failed, signup"})
    }
    finally{
        prisma.$disconnect();
    }
})

userRouter.get("/signout",(req,res)=>{
    const token = req.cookies.token;
    console.log("token backd",token)
    if(token){
        res.clearCookie("token",{
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
        return res.json({message:"Success"});
    }else{
        return res.status(400).json({message:"Already signout out !!"});
    }
})

userRouter.put("/update",authMiddleware,async(req:CustomRequest,res)=>{
    try {
        const {username,imageUrl}:UserUpdate= req.body;
        const updateUser:UserUpdate = {};
        if(username)updateUser.username = username;
        if(imageUrl)updateUser.imageUrl = imageUrl;
        if(username || imageUrl){
            const updatedUser = await prisma.user.update({
                where: {
                    id: req.user.id
                },
                data: updateUser
            });
            return res.json({message:"Success",user: updatedUser})
        }
        else{
            return res.json({message:"Could not update user "})
        }
    } catch (error) {
        return res.status(400).json({message:"User update failed !!"})
    }
})

userRouter.put("/connect-with-mentor/:id",authMiddleware,async(req,res)=>{
    try {
        const Id = req.params["id"];
        const mentorId = Id.split("=")[1];
        const {username,money} = req.body;
        var mentor = await prisma.mentor.findUnique({
            where:{id:mentorId}
        })

        var user = await prisma.user.findFirst({
            where:{
                username:username
            }
        });
        if(!user){
            return res.status(400).json({message:"No such user exists !!"})
        }
        const roomId = uuidv4();
        const userRooms = user.roomId;
        userRooms.push(roomId);
        if(!mentor){
            return res.status(400).json({message:"Mentor does not exist !!"})
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

        mentor = await prisma.mentor.update({
            where:{id:mentorId},
            data:{
                roomId:mentorRooms,
                usersName:{push:username},
                userMentored:{increment:1}
            }
        })
        console.log("updated mentor",mentor)
        user = await prisma.user.update({
            where:{username:username},
            data:{
                username:username,
                roomId:userRooms,
                mentorName:{push:mentor.username}
            }
        })
        console.log("updated user",user)
        return res.json({message:"success",roomId:roomId,user:user,mentor:mentor})
    } catch (error) {
        console.log(error);
    }
})

export {userRouter};