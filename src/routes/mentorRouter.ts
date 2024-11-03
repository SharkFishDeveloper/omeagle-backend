import express from "express";
import prisma from "../db";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../utils";
import bcrypt from "bcrypt";
import { CustomRequest, authMentorMiddleware, authMiddleware, initialMentorRequest } from "../middleware/authMiddleware";
import { forEachChild } from "typescript";
//! add zod for signup and login for both mentor and user

interface UpdateMentor {
    username?:string,
    imageUrl?:string,
    university?:string,
    specializations?:string[],
    timeslots?:number[],
    price? :number
}


const mentorRouter = express.Router();

mentorRouter.get("/",initialMentorRequest);

mentorRouter.post("/login",async(req,res)=>{
    try {
        const {password,email} = req.body;
        if(!email||!password){
            return res.status(400).json({message:"Invalid email or password"});
        }
    const user = await prisma.mentor.findUnique({
        where:{
            email
        }
    })
    if(!user){return res.json({message:"User does not exist"})}
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

mentorRouter.post("/signup",async(req,res)=>{
    const {username,password,email} = req.body;
    try {
        const findUSer = await prisma.mentor.findMany({
            where:{
                email,
                username
            }
        })
        if(findUSer.length > 0){
            return res.status(400).json({message:"User already exists !!"})
        }
        const cryptedPassword =await bcrypt.hash(password,10);
        const user = await prisma.mentor.create({
            data:{username,password:cryptedPassword,email},
        })
        const token = await jwt.sign(user.id,JWT_SECRET_KEY);
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



mentorRouter.post("/search",authMiddleware,async(req,res)=>{
    try {
        const {username:searchname,selectedTags:specializations,university}:{username:string|undefined,selectedTags:string[]|undefined,university:string|undefined}= req.body;

            if(!searchname && !specializations?.length && !university) {
            return res.status(303).json({ message: "No search criteria provided!" });
            }
         
            console.log("USERNAME",searchname,specializations,university)  
            const whereConditions: any = {};

            if(searchname) {
                whereConditions.username = { contains:searchname, mode: 'insensitive',};
            }
            if (specializations && specializations.length > 0) {
                whereConditions.specializations = { hasEvery: specializations };
            }
            if (university) {
                whereConditions.university = { contains: university, mode: 'insensitive', };
            }

          const users = await prisma.mentor.findMany({
            where: whereConditions,
            take: 10, // Limit the results to the best matching 10 mentors
        });

        console.log("mentor users",)
    return res.json({message:`success`,users:users})
    } catch (error) {
        console.log("errro in fiding user",error)
    }
})

mentorRouter.get(`/:id`,authMiddleware,async(req,res)=>{
    try {

        const mentorID = req.params.id ;
        const mentorPara = mentorID.split("=")[1];
        console.log("her",mentorID);
        const user = await prisma.mentor.findUnique({
        where:{
            id:mentorPara 
        }
        })
        if(!user){
        return res.status(400).json({message:"No mentor found"});
        }
        else{
        return res.json({message:user})
        }
    } 
    catch (error) {
     console.log(error);   
     res.status(403).json({message:"No mentor found",error:error})
    }
    finally{
        prisma.$disconnect();
    }
})






mentorRouter.put("/update",authMentorMiddleware,async(req:CustomRequest,res)=>{

    try {
    const {price,username,imageUrl,university,specializations,timeslots}:UpdateMentor= req.body;
    
    const mentorDataToUpdate:UpdateMentor = {};
    if (username) mentorDataToUpdate.username = username;
    if (imageUrl) mentorDataToUpdate.imageUrl = imageUrl;
    if (university) mentorDataToUpdate.university = university;
    if (specializations) {
        mentorDataToUpdate.specializations = specializations.map(specialization => specialization.trim()).filter(specialization => specialization.length > 0);
    }

    if (specializations) mentorDataToUpdate.price = price;

    if(timeslots){
        timeslots.sort((a, b) => a - b);
        for (let i = 0; i < timeslots.length; i++) {
            if(timeslots[i] - timeslots[i-1] <=1 ){
                return res.status(300).json({message:"Time slots are too close. Keep difference of atleast 2 !!"})
            }
        }
        mentorDataToUpdate.timeslots = timeslots;
    };
    console.log("UPDATE DATA",mentorDataToUpdate)
    const userId = req.user;
    const userUpdated = await prisma.mentor.update({
        where:{
            id:userId 
        },
        data:mentorDataToUpdate
    })
    console.log(userUpdated);
    return res.json({message:"Success",user:userUpdated})
    } catch (error) {
        console.log("Mentor update error",error)
        return res.status(405).json({message:"Mentor update failed !!"})
    }
})


export {mentorRouter};