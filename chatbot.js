import Groq from 'groq-sdk/index.mjs';
import dotenv from "dotenv";
import {tavily}  from "@tavily/core";
// import readline from 'node:readline/promises'
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROK_API });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY  });

export async function generate(question){

   
    const messages = [
            {
                role:'system',
                content:`You are a smart personal assistant who answers the asked question. give short and customized answer.
                You have access to following tools:
                1. webSearch({query} : {query: string}) // Search the latest information and real-time data on internet.
                current date and time: ${new Date().toUTCString()};
                `
            },
            // {
            //     role:'user',
            //     // content:'What is array in programming'
            //     content:'What is current weather in Mumbai'
            //     // content:"When Iphone 16 was launched"
            // }
          ]

    
   


        messages.push({
            role:'user',
            content: question
        })

        while(true){

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

    const toolCalls = completions.choices[0].message.tool_calls;

    if(!toolCalls){
        // console.log(`Assistant : ${completions.choices[0].message.content}`)
        console.log(messages)
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