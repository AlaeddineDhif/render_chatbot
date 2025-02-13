document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    loadChatHistory();
});

let currentChat = [];
let isProcessing = false;

async function processQuestion(question = null) {
    if (isProcessing) return;
    
    const inputField = document.getElementById('userInput');
    const questionText = question || inputField.value.trim();
    
    if (!questionText) return;

    isProcessing = true;
    inputField.value = '';
    showTypingIndicator();
    
    try {
        addMessage(questionText, true);
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: questionText })
        });
        
        const data = await response.json();
        if (data.success) {
            addMessage(data.answer, false);
            saveToHistory(questionText, data.answer);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        addMessage(`Désolé, une erreur est survenue : ${error.message}`, false);
    } finally {
        hideTypingIndicator();
        isProcessing = false;
    }
}

function addMessage(content, isUser) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    if (!isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-tools">
                <button class="tool-btn copy-btn" onclick="copyMessage(this)">
                    <i data-feather="copy"></i>
                </button>
                <button class="tool-btn" onclick="rateResponse(this, true)">
                    <i data-feather="thumbs-up"></i>
                </button>
                <button class="tool-btn" onclick="rateResponse(this, false)">
                    <i data-feather="thumbs-down"></i>
                </button>
            </div>
        `;
    } else {
        messageDiv.textContent = content;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    feather.replace();
}

function showTypingIndicator() {
    const chatBox = document.getElementById('chatBox');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <span>Réponse en cours</span>
        <div class="dots">
            <div class="dot-flashing"></div>
            <div class="dot-flashing" style="animation-delay: 0.2s"></div>
            <div class="dot-flashing" style="animation-delay: 0.4s"></div>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function hideTypingIndicator() {
    document.querySelector('.typing-indicator')?.remove();
}

function copyMessage(button) {
    const message = button.closest('.message').querySelector('.message-content').textContent;
    navigator.clipboard.writeText(message);
    button.innerHTML = '<i data-feather="check"></i>';
    feather.replace();
    setTimeout(() => {
        button.innerHTML = '<i data-feather="copy"></i>';
        feather.replace();
    }, 2000);
}

function rateResponse(button, isPositive) {
    button.disabled = true;
    button.innerHTML = isPositive 
        ? '<i data-feather="thumbs-up" style="color: #10b981"></i>' 
        : '<i data-feather="thumbs-down" style="color: #ef4444"></i>';
    feather.replace();
}

function saveToHistory(question, answer) {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push({ question, answer, date: new Date() });
    localStorage.setItem('chatHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

function loadChatHistory() {
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const historyContainer = document.querySelector('.history-items');
    
    historyContainer.innerHTML = history
        .map((entry, index) => `
            <div class="history-item" onclick="loadHistoryEntry(${index})">
                <div class="preview-text">${entry.question}</div>
                <small>${new Date(entry.date).toLocaleDateString()}</small>
            </div>
        `).join('');
}

// Gestionnaire d'événement pour la touche Entrée
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processQuestion();
    }
});