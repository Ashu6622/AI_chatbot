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
    const {message, userId} = req.body;
  
    if(!message){
        return res.json({message:'Empty Message'})
    }

    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 20000); // 20 seconds
        });

        // Race between generate function and timeout
        const response = await Promise.race([
            generate(message, userId),
            timeoutPromise
        ]);

        return res.json({message : response});
    } catch (error) {
        if (error.message === 'Timeout') {
            return res.json({message: 'Request timed out. Please try again.'});
        }
        return res.json({message: 'An error occurred. Please try again.'});
    }
})

app.listen(PORT, ()=>{
    console.log(`Server is running on `,PORT);
})