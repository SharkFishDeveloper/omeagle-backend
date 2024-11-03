import express from "express"; 
import { Server, Socket } from "socket.io";
import http from "http"; 
import cors from "cors"; 
import {UserManager} from "./managers/UserManager"
import { userRouter } from "./routes/userRouter";
import { mentorRouter } from "./routes/mentorRouter";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}))
const server  = http.createServer(app);

const io = new Server(server,{
    cors:{
      origin: "*"
    }
});
const userManager = new UserManager();

io.on('connection', (socket:Socket) => {
    socket.on('joinRoom',({name,university}:{name:string,university?:string})=>{
      console.log("University ",university)
      if (university && university.trim() !== "") {
        console.log("Universty",university)
        //! main CRUX
        userManager.addBigUser(name,socket,university);
      }
      else{
        //! main CRUX
        userManager.addUser(name,socket);
        console.log("Totally random",name)
      }
    })
    
    // Listen for messages from the client
    socket.on('send-message', (message:string) => {
      // console.log('Message from client:', message);
      socket.broadcast.emit("receive-message",message);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
    const { userType } = userManager.removeUser(socket.id);
    if (userType === 'bigUser') {
      console.log(`User with university disconnected: ${socket.id}`);
    } else if (userType === 'normalUser') {
      console.log(`Regular user disconnected: ${socket.id}`);
    } else {
      console.log(`Unknown user disconnected: ${socket.id}`);
    }
    });
  });


app.use("/app/user",userRouter);
app.use("/app/mentor",mentorRouter);

app.get("/data",(req,res)=>{
  return  res.json({"All data of map":userManager.returnMapData()})
})

server.listen(3000,()=>{
    console.log("Server running 3000")
})