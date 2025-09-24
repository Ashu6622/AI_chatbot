import Groq from 'groq-sdk';
import dotenv from "dotenv";
import {tavily}  from "@tavily/core";
// import readline from 'node:readline/promises'
dotenv.config();

import NodeCache from "node-cache";
var myCache = new NodeCache({ stdTTL: 60*60*24});
const groq = new Groq({ apiKey: process.env.GROK_API });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY  });


// preventing ininite loop with LLM and chatbot
//adding memory of the chat to the llama

export async function generate(question, userId){

   
    const baseMessage = [
            {
                role:'system',
                content:`You are a smart personal assistant who answers the asked question. give short and customized answer.
                You have access to following tools:
                1. webSearch({query} : {query: string}) // Search the latest information and real-time data on internet.
                Use it when user asks about recent information or news or about current  events.
                current date and time: ${new Date().toUTCString()};
                If you have the answer in points like
                1. This is one Point, 2. This is second Point, and so on then display it in a wat that every point must display in new line like
                1) First Point
                2) Second point
                3) Third Point

                When providing code:
                - Always wrap code in triple backticks  with language name
                - Example: java (newline) code here (newline) 
                - Give proper approach and explanation
                - Provide dry run example if requested
                - Ensure proper indentation and formatting within code blocks
                

                if the answer u are providing  contains points under main points then make the points as numerical and the sub point as bullet points also bold the important word`
            }
          ]

        const messages = myCache.has(userId) ? myCache.get(userId) : baseMessage;

        messages.push({
            role:'user',
            content: question
        })

        const MAX_RETRIES = 10;
        let count = 0


        while(true){

            if(count > MAX_RETRIES){
                return 'Sorry could not fund the result, please try again'
            }

            count++;
            // console.log(count);

        const completions = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          temperature:0,
          messages: messages, 
          tools: [
            {
                type: 'function',
                function : {
                    name: 'webSearch',
                    description: "Search the latest information and real-time data on internet",
                    parameters: {
                        type:'object',
                        properties:{

                            query: {
                                type:'string',
                                description: 'The search query to perform search on.'
                            },
                        },
                        required: ['query'],
                    },
                }
            }
          ],
          tool_choice:'auto'
    })

    messages.push(completions.choices[0].message)
    // console.log("answer => ", completions.choices[0].message)

    const toolCalls = completions.choices[0].message.tool_calls;

    if(!toolCalls){
        // console.log(`Assistant : ${completions.choices[0].message.content}`)
        // console.log(messages)
        myCache.set(userId, messages);
        return completions.choices[0].message.content
        // break;
    }

    for(const tool of toolCalls){
        // console.log(`tools : `, tool )
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if(functionName === "webSearch"){
            const toolResult = await webSearch(JSON.parse(functionParams))
            // console.log('Tool Result : ', toolResult);

            messages.push({
                tool_call_id:tool.id,
                role:'tool',
                name:functionName,
                content: toolResult,
            });
        }
    }

}
}


async function webSearch({query}){

    console.log('Calling web search ...');
    const response = await tvly.search(query);
    // console.log('Response : ', response);
    const finalResult = response.results.map((result)=> result.content).join('\n\n');
    // console.log(finalResult);
    return finalResult
    // return 'Iphone was launced on 20 September 2024'

}