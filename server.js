import express from 'express';
import dotenv from 'dotenv';
import {generate} from './chatbot.js'
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
const PORT = 3001;

app.post('/chat', async (req, res)=>{
    const {message, userId} = req.body;
    // console.log(message, userId);
  
    if(!message){
        return res.json({message:'Empty Message'})
    }

    let responseReturned = false;
    
    // Set 20-second timeout
    setTimeout(() => {
        if (!responseReturned) {
            responseReturned = true;
            return res.json({message: 'Request timed out. Please try again.'});
        }
    }, 20000);

    try {
        const response = await generate(message, userId);
        
        if (!responseReturned) {
            responseReturned = true;
            return res.json({message: response});
        }
    } catch (error) {
        if (!responseReturned) {
            responseReturned = true;
            return res.json({message: 'An error occurred. Please try again.'});
        }
    }
})

export default app;