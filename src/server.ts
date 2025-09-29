import { Chat } from './chat';

export { Chat };

interface Env {
  Chat: DurableObjectNamespace;
  AI: any;
  OPENAI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const id = env.Chat.idFromName('chat-session');
      const stub = env.Chat.get(id);
      return stub.fetch(request);
    }
    
    // API Routes
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: Date.now(),
        ai_available: !!env.AI
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Serve HTML frontend
    return new Response(getHTMLContent(), {
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
};

function getHTMLContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Powered Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .chat-container {
            width: 100%;
            max-width: 800px;
            height: 90vh;
            max-height: 700px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }
        
        .chat-header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .chat-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .status {
            padding: 10px 20px;
            text-align: center;
            font-size: 14px;
            background: #f8f9fa;
            color: #666;
            border-bottom: 1px solid #eee;
        }
        
        .status.connected {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status.error {
            background: #ffebee;
            color: #c62828;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: #f5f5f5;
        }
        
        .message {
            max-width: 70%;
            padding: 12px 18px;
            border-radius: 18px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            align-self: flex-end;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .message.assistant {
            align-self: flex-start;
            background: white;
            color: #333;
            border: 1px solid #e0e0e0;
        }
        
        .message.system {
            align-self: center;
            background: #e3f2fd;
            color: #1565c0;
            font-size: 14px;
            font-style: italic;
        }
        
        .typing {
            align-self: flex-start;
            padding: 12px 18px;
            background: white;
            border-radius: 18px;
            color: #666;
            font-style: italic;
        }
        
        .chat-input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #eee;
        }
        
        .chat-input {
            display: flex;
            gap: 10px;
        }
        
        .input-field {
            flex: 1;
            padding: 14px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            outline: none;
            font-size: 15px;
            transition: all 0.3s;
        }
        
        .input-field:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .send-button {
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            font-size: 15px;
        }
        
        .send-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .chat-messages::-webkit-scrollbar {
            width: 8px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h1>🤖 AI-Powered Assistant</h1>
            <p>Built with Cloudflare Workers AI</p>
        </div>
        
        <div class="status" id="status">Connecting...</div>
        
        <div class="chat-messages" id="messages"></div>
        
        <div class="chat-input-container">
            <div class="chat-input">
                <input 
                    type="text" 
                    class="input-field" 
                    id="messageInput" 
                    placeholder="Type your message..."
                    autocomplete="off"
                />
                <button class="send-button" id="sendButton">Send</button>
            </div>
        </div>
    </div>

    <script>
        class ChatApp {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.isTyping = false;
                
                this.messagesContainer = document.getElementById('messages');
                this.messageInput = document.getElementById('messageInput');
                this.sendButton = document.getElementById('sendButton');
                this.statusElement = document.getElementById('status');
                
                this.setupEventListeners();
                this.connect();
            }
            
            setupEventListeners() {
                this.sendButton.addEventListener('click', () => this.sendMessage());
                this.messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
            
            connect() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = protocol + '//' + window.location.host;
                
                this.updateStatus('Connecting...', '');
                
                try {
                    this.ws = new WebSocket(wsUrl);
                    
                    this.ws.onopen = () => {
                        this.reconnectAttempts = 0;
                        this.updateStatus('Connected ✓', 'connected');
                        this.addSystemMessage('Connected! Ask me anything.');
                        this.sendButton.disabled = false;
                    };
                    
                    this.ws.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            this.handleMessage(data);
                        } catch (e) {
                            console.error('Failed to parse message:', e);
                        }
                    };
                    
                    this.ws.onclose = () => {
                        this.updateStatus('Disconnected', 'error');
                        this.sendButton.disabled = true;
                        this.attemptReconnect();
                    };
                    
                    this.ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        this.updateStatus('Connection error', 'error');
                    };
                } catch (error) {
                    console.error('Failed to create WebSocket:', error);
                    this.updateStatus('Failed to connect', 'error');
                    this.attemptReconnect();
                }
            }
            
            attemptReconnect() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
                    this.updateStatus(\`Reconnecting in \${delay/1000}s...\`, 'error');
                    setTimeout(() => this.connect(), delay);
                } else {
                    this.updateStatus('Connection failed. Refresh page to retry.', 'error');
                }
            }
            
            handleMessage(data) {
                switch (data.type) {
                    case 'connected':
                        this.addSystemMessage(data.message || 'Ready to chat!');
                        break;
                    case 'message':
                        this.removeTypingIndicator();
                        this.addMessage('assistant', data.content);
                        break;
                    case 'typing':
                        if (data.isTyping) {
                            this.showTypingIndicator();
                        } else {
                            this.removeTypingIndicator();
                        }
                        break;
                    case 'error':
                        this.removeTypingIndicator();
                        this.addSystemMessage('Error: ' + data.message);
                        break;
                }
            }
            
            sendMessage() {
                const content = this.messageInput.value.trim();
                if (!content || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    return;
                }
                
                this.addMessage('user', content);
                
                this.ws.send(JSON.stringify({
                    type: 'chat',
                    content: content
                }));
                
                this.messageInput.value = '';
                this.messageInput.focus();
            }
            
            addMessage(role, content) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${role}\`;
                messageDiv.textContent = content;
                
                this.messagesContainer.appendChild(messageDiv);
                this.scrollToBottom();
            }
            
            addSystemMessage(content) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message system';
                messageDiv.textContent = content;
                
                this.messagesContainer.appendChild(messageDiv);
                this.scrollToBottom();
            }
            
            showTypingIndicator() {
                if (this.isTyping) return;
                
                const typingDiv = document.createElement('div');
                typingDiv.className = 'typing';
                typingDiv.id = 'typing-indicator';
                typingDiv.textContent = 'AI is thinking...';
                
                this.messagesContainer.appendChild(typingDiv);
                this.scrollToBottom();
                this.isTyping = true;
            }
            
            removeTypingIndicator() {
                const indicator = document.getElementById('typing-indicator');
                if (indicator) {
                    indicator.remove();
                    this.isTyping = false;
                }
            }
            
            updateStatus(message, className) {
                this.statusElement.textContent = message;
                this.statusElement.className = 'status ' + className;
            }
            
            scrollToBottom() {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }
        
        // Initialize app when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            new ChatApp();
        });
    </script>
</body>
</html>`;
}
