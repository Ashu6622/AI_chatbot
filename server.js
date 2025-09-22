import express from 'express';
import dotenv from 'dotenv';
import {generate} from './chatbot.js'
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
const PORT = 3001;


app.get('/', (req, res)=>{
    res.send('WelCome to ChatGPT')
})


app.post('/chat', async (req, res)=>{
    const {message} = req.body;
    // console.log("message : ",  req.body)
    if(!message){
        return res.json({message:'Empty Message'})
    }
    // console.log(message);

    const response = await generate(message);
    return res.json({message : response});


})

app.listen(PORT, ()=>{
    console.log(`Server is running on `,PORT);
})