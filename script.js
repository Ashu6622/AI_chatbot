console.log('Script loaded successfully');

const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container');
const askBtn = document.querySelector('#ask');

input.addEventListener('keyup', handleEnter);
askBtn.addEventListener('click', handleAsk);

 const userId = `${Date.now().toString().slice(-4)}${Math.random().toString(36).substr(2, 8)}`;

const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse';
loading.textContent = 'Thinking...';


async function generate(text){

    /**
     * 1. Append message to UI
     * 2. Send it to LLM
     * 3. Append response to UI
     */

    // Disable button and input
    askBtn.disabled = true;
    input.disabled = true;
    askBtn.textContent = 'Thinking...';
    askBtn.className = 'bg-gray-400 px-4 py-1 text-black rounded-full cursor-not-allowed';

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
    
    // Format code blocks, points and line breaks
    let formattedMessage = assistantMessage.message;
    
    // Handle code blocks with ``` markdown FIRST (before decoding entities)
    formattedMessage = formattedMessage.replace(/```([\s\S]*?)```/g, (match, code) => {
        // Decode HTML entities in code first
        let cleanCode = code.trim()
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;amp;/g, '&')
            .replace(/&amp;/g, '&')
            .replace(/^\d+\)\s*/gm, '') // Remove numbered points like "1) "
            .replace(/^\d+\.\s*/gm, '') // Remove numbered points like "1. "
            .replace(/^\*\s*/gm, '')   // Remove bullet points
            .replace(/&nbsp;/g, ' ')    // Replace &nbsp; with regular spaces
            .replace(/•/g, '')          // Remove bullet characters
            .replace(/\s*\n\s*\n/g, '\n') // Remove extra blank lines
            .replace(/^\s+/gm, (match) => match.replace(/\s/g, ' ')); // Normalize indentation
        
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
        return `<div class="relative my-2">
            <button onclick="copyCode('${codeId}')" class="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs">Copy</button>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-700" style="font-family: 'Courier New', monospace; white-space: pre-wrap; line-height: 1.5;"><code id="${codeId}">${cleanCode}</code></pre>
        </div>`;
    });
    
    // Handle inline code with `
    formattedMessage = formattedMessage.replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-green-400 px-1 rounded">$1</code>');
    
    // Decode HTML entities for non-code content
    formattedMessage = formattedMessage
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;amp;/g, '&')
        .replace(/&amp;/g, '&');
    
    // Format headers, points and line breaks
    formattedMessage = formattedMessage
        .replace(/### ([^\n]+)/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-blue-400">$1</h3>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/(\. )(\d+\.\s)/g, '$1<br><span class="font-semibold text-green-400">$2</span>') 
        .replace(/(\. )(\d+\)\s*)/g, '$1<br><span class="font-semibold text-green-400">$2</span>')
        .replace(/^(\d+\.\s)/gm, '<span class="font-semibold text-green-400">$1</span>') 
        .replace(/^(\d+\)\s*)/gm, '<span class="font-semibold text-green-400">$1</span>') 
        .replace(/\*\s+/g, '<br>&nbsp;&nbsp;<span class="text-blue-300">•</span> ') 
        .replace(/^<br>/, '');
    
    assistantMsgElem.innerHTML = formattedMessage;
    loading.remove();
    chatContainer?.appendChild(assistantMsgElem);
    
    // Auto-scroll to show the new response immediately
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);

    // Re-enable button and input
    askBtn.disabled = false;
    input.disabled = false;
    askBtn.textContent = 'Ask';
    askBtn.className = 'bg-white px-4 py-1 text-black rounded-full cursor-pointer hover:bg-gray-300';


}

  async function callServer(inputText){
    console.log(inputText, userId)
            const response = await fetch('http://localhost:3001/chat', {
                method:'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({message:inputText, userId})
            })

            if(!response.ok){
                throw new Error('Error in fetching response from server');
            }

            const result = response.json();
            return result;
    }

async function handleAsk(e){
    // Prevent action if button is disabled
    if(askBtn.disabled) return;
    
    const text = input?.value.trim();
    if(!text){
        return
    }

    await generate(text);
}

async function handleEnter(e){

    if(e.key === 'Enter'){
        // Prevent action if input is disabled
        if(input.disabled) return;
        
        const text = input?.value.trim();
        if(!text){
            return;
        }

        await generate(text);
    }
}

// Copy code function
function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    const text = codeElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const button = codeElement.parentElement.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

// Make copyCode function global
window.copyCode = copyCode;
