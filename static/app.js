let currentChat = null;
let chats = JSON.parse(localStorage.getItem('chats')) || [];

function init() {
    if (chats.length === 0) {
        createNewChat();
    } else {
        currentChat = chats[chats.length - 1];
        loadChat(currentChat);
    }
    renderChatList();

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

function createNewChat() {
    const newChat = {
        id: Date.now(),
        title: `Discussion ${chats.length + 1}`,
        messages: [],
        created: new Date().toISOString()
    };
    chats.push(newChat);
    currentChat = newChat;
    saveToLocalStorage();
    renderChatList();
    clearChatBox();
    window.location.href = '/';
}

function renderChatList() {
    const chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML = '';
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.textContent = chat.title;
        div.onclick = () => loadChat(chat);
        chatHistory.appendChild(div);
    });
}

function loadChat(chat) {
    currentChat = chat;
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    
    chat.messages.forEach(msg => {
        appendMessage(msg.content, msg.role);
    });
}

function appendMessage(content, role) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function processQuestion() {
    const input = document.getElementById('userInput');
    const question = input.value.trim();
    if (!question) return;

    // Message utilisateur
    const userMsg = {
        content: question,
        role: 'user',
        timestamp: new Date().toISOString()
    };
    currentChat.messages.push(userMsg);
    appendMessage(question, 'user');
    input.value = '';
    
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let aiMsg = null;
        let messageDiv = null;
        const chatBox = document.getElementById('chatBox');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                let data;
                try {
                    data = JSON.parse(line);
                } catch (e) {
                    console.error('JSON invalide:', line);
                    continue;
                }

                if (data.error) {
                    appendMessage(`Erreur: ${data.error}`, 'ai');
                    throw new Error(data.error);
                }

                if (!aiMsg) {
                    // Création du message AI
                    aiMsg = {
                        content: data.chunk,
                        role: 'ai',
                        timestamp: data.timestamp
                    };
                    currentChat.messages.push(aiMsg);
                    appendMessage(data.chunk, 'ai');
                    messageDiv = chatBox.lastChild;
                } else {
                    // Mise à jour progressive
                    aiMsg.content += data.chunk;
                    messageDiv.querySelector('div').textContent = aiMsg.content;
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }
            buffer = lines[lines.length - 1];
        }

        if (buffer.trim()) {
            const data = JSON.parse(buffer);
            aiMsg.content += data.chunk;
            messageDiv.querySelector('div').textContent = aiMsg.content;
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        saveToLocalStorage();
        
    } catch (error) {
        appendMessage(`Erreur: ${error.message}`, 'ai');
    }
}

// Les autres fonctions restent identiques...