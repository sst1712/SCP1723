const CHAT_CSS = `
#chat-window {
    position: fixed;
    bottom: 110px;
    right: 30px;
    width: 380px;
    height: 550px;
    background: #f1f5f9;
    border-radius: 20px;
    display: none;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    overflow: hidden;
    z-index: 9999;
}

#chat-header {
    background: #2563eb;
    color: white;
    padding: 20px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
}

#chat-frame {
    margin: 12px;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    height: calc(100% - 24px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.05), inset 0 0 0 1px #e2e8f0;
    overflow: hidden;
}

#chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.msg {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
    max-width: 80%;
    word-wrap: break-word;
}

.user {
    background: #2563eb;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}

.bot {
    background: #e2e8f0;
    color: #1e293b;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
}

.typing {
    font-style: italic;
    color: #64748b;
    font-size: 12px;
    display: none;
}

#chat-input-area {
    display: flex;
    padding: 15px;
    background: white;
    border-top: 1px solid #e2e8f0;
    gap: 10px;
}

#chat-input {
    flex: 1;
    border: 1px solid #cbd5e1;
    padding: 12px;
    border-radius: 25px;
    outline: none;
}

#send-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0 20px;
    border-radius: 25px;
    cursor: pointer;
    font-weight: bold;
}

#send-btn:disabled {
    background: #94a3b8;
}
`;

const CHAT_HTML = `
<div id="chat-window">
    <div id="chat-header">
        <span>Supply Chain Assistant</span>
        <span style="cursor:pointer" id="close-chat-btn">✕</span>
    </div>
    <div id="chat-frame">
        <div id="chat-messages">
            <div class="msg bot">
                Welcome! I can help you find client and supplier information. What do you need?
            </div>
            <div id="typing-indicator" class="typing">Assistant is typing...</div>
        </div>
        <div id="chat-input-area">
            <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off">
            <button id="send-btn">Send</button>
        </div>
    </div>
</div>
`;

window.initChat = function() {
    // Inject CSS
    const style = document.createElement("style");
    style.innerHTML = CHAT_CSS;
    document.head.appendChild(style);

    // Inject HTML
    const chatContainer = document.createElement("div");
    chatContainer.innerHTML = CHAT_HTML;
    document.body.appendChild(chatContainer);

    // Bind elements
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const triggerBtn = document.getElementById('chat-trigger');
    const closeBtn = document.getElementById('close-chat-btn');

    let chatHistory = [];

    function toggleChat() {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
        if (chatWindow.style.display === 'flex') chatInput.focus();
    }

    triggerBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;
        msgDiv.innerText = text;
        chatMessages.insertBefore(msgDiv, typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        // 🔥 LOCAL GREETING DETECTION
        const greetings = ["hi", "hello", "hlo", "hey", "hola"];
        if (greetings.includes(text.toLowerCase())) {
            setTimeout(() => {
                appendMessage('bot', "Hello! I am your Supply Chain Assistant. How can I help you with your orders or logistics today?");
            }, 500);
            return;
        }

        typingIndicator.style.display = 'block';
        chatInput.disabled = true;
        sendBtn.disabled = true;


        try {
            // Using unified global API URL if available, else fallback
            const baseURL = (typeof API_URL !== 'undefined') ? API_URL : 'http://localhost:3000/api';
            const response = await fetch(`${baseURL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });

            const data = await response.json();

            if (data.reply) {
                appendMessage('bot', data.reply);

                chatHistory.push({ role: "user", parts: [{ text: text }] });
                chatHistory.push({ role: "model", parts: [{ text: data.reply }] });
            }

        } catch (err) {
            appendMessage('bot', "Connection lost. Please ensure the backend is running.");
        } finally {
            typingIndicator.style.display = 'none';
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
};
