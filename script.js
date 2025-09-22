console.log('Script loaded successfully');

const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container');
const askBtn = document.querySelector('#ask');

input.addEventListener('keyup', handleEnter);
askBtn.addEventListener('click', handleAsk);

const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse';
loading.textContent = 'Thinking...';


async function generate(text){

    /**
     * 1. Append message to UI
     * 2. Send it to LLM
     * 3. Append response to UI
     */

    const msg = document.createElement('div');
    msg.className = `my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`
    msg.textContent = text;
    chatContainer?.appendChild(msg);
    // console.log(text);

    input.value = '';

    console.log(loading)
    chatContainer?.appendChild(loading)

    // call server

    const assistantMessage = await callServer(text);

    const assistantMsgElem = document.createElement('div');
    assistantMsgElem.className = `max-w-fit`
    assistantMsgElem.textContent = assistantMessage.message;
    loading.remove();
    chatContainer?.appendChild(assistantMsgElem);


}

  async function callServer(inputText){
    console.log(inputText);
            const response = await fetch('http://localhost:3001/chat', {
                method:'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({message:inputText})
            })

            if(!response.ok){
                throw new Error('Error in fetching response from server');
            }

            const result = response.json();
            return result;
    }

async function handleAsk(e){
    const text = input?.value.trim();
    if(!text){
        return
    }

    await generate(text);
}

async function handleEnter(e){

    if(e.key === 'Enter'){
        const text = input?.value.trim();
        if(!text){
            return;
        }

        await generate(text);
    }
}
