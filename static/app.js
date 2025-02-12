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

    // Activer le mode sombre si déjà configuré
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
        appendMessage(msg.content, msg.role, msg.timestamp);
    });
}

function appendMessage(content, role, timestamp) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date(timestamp).toLocaleTimeString();
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function processQuestion() {
    const input = document.getElementById('userInput');
    const question = input.value.trim();
    if (!question) return;

    // Ajouter message utilisateur
    const userMsg = {
        content: question,
        role: 'user',
        timestamp: new Date().toISOString()
    };
    currentChat.messages.push(userMsg);
    appendMessage(question, 'user', userMsg.timestamp);
    
    input.value = '';
    
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const aiMsg = {
                content: data.answer,
                role: 'ai',
                timestamp: data.timestamp
            };
            currentChat.messages.push(aiMsg);
            appendMessage(data.answer, 'ai', data.timestamp);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        appendMessage(`Erreur: ${error.message}`, 'ai', new Date().toISOString());
    }
    
    saveToLocalStorage();
}

function clearHistory() {
    if (confirm("Êtes-vous sûr de vouloir effacer l'historique ?")) {
        localStorage.removeItem('chats');
        location.reload();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function downloadHistory() {
    const blob = new Blob([JSON.stringify(chats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique-chats.json';
    a.click();
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processQuestion();
});