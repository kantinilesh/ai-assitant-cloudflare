export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Env {
  AI: any;
  OPENAI_API_KEY?: string;
}

export class Chat {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket>;
  private conversationHistory: ChatMessage[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.conversationHistory = [];
    
    // Initialize conversation history from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<ChatMessage[]>('conversationHistory');
      if (stored) {
        this.conversationHistory = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async handleSession(websocket: WebSocket) {
    websocket.accept();
    this.sessions.add(websocket);

    // Send welcome message
    websocket.send(JSON.stringify({
      type: 'connected',
      message: 'Welcome! I\'m powered by Cloudflare Workers AI. How can I help you today?'
    }));

    websocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        
        if (data.type === 'chat') {
          await this.handleChatMessage(websocket, data.content);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        websocket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process your message. Please try again.'
        }));
      }
    });

    websocket.addEventListener('close', () => {
      this.sessions.delete(websocket);
    });

    websocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(websocket);
    });
  }

  async handleChatMessage(websocket: WebSocket, content: string) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: content
    });

    // Send typing indicator
    websocket.send(JSON.stringify({
      type: 'typing',
      isTyping: true
    }));

    try {
      // Generate AI response
      const aiResponse = await this.generateAIResponse(content);

      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      // Keep only last 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Save to storage
      await this.state.storage.put('conversationHistory', this.conversationHistory);

      // Send response
      websocket.send(JSON.stringify({
        type: 'message',
        content: aiResponse
      }));

    } catch (error) {
      console.error('AI generation error:', error);
      websocket.send(JSON.stringify({
        type: 'error',
        message: 'Sorry, I encountered an error generating a response.'
      }));
    } finally {
      // Stop typing indicator
      websocket.send(JSON.stringify({
        type: 'typing',
        isTyping: false
      }));
    }
  }

  async generateAIResponse(userMessage: string): Promise<string> {
    try {
      // Prepare messages for context
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and friendly responses.'
        },
        ...this.conversationHistory.slice(-10), // Last 10 messages for context
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Use Cloudflare Workers AI (Llama model)
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: messages,
        max_tokens: 512,
        temperature: 0.7
      });

      return response.response || "I'm sorry, I couldn't generate a response.";

    } catch (error) {
      console.error('AI API error:', error);
      return "I'm experiencing technical difficulties. Please try again in a moment.";
    }
  }

  async alarm() {
    // Clean up old sessions
    this.sessions.forEach(ws => {
      if (ws.readyState === WebSocket.CLOSED) {
        this.sessions.delete(ws);
      }
    });
  }
}