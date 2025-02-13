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
    window.location.href = '/'; // Recharger la page pour la nouvelle discussion
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

    // Ajouter message utilisateur
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
        
        const data = await response.json();
        
        if (data.success) {
            const aiMsg = {
                content: data.answer,
                role: 'ai',
                timestamp: data.timestamp
            };
            currentChat.messages.push(aiMsg);
            appendMessage(data.answer, 'ai');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        appendMessage(`Erreur: ${error.message}`, 'ai');
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function saveToLocalStorage() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processQuestion();
});