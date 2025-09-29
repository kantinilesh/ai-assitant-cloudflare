# AI-Powered Assistant on Cloudflare

A sophisticated AI-powered chat application built with Cloudflare's Agents SDK, featuring real-time communication, persistent state management, and advanced workflow coordination.

## Features

✅ **LLM Integration**: Powered by Llama 3.3 on Workers AI
✅ **Real-time Chat**: WebSocket-based communication with typing indicators  
✅ **Voice Input**: Voice message support with transcription simulation
✅ **Workflow Coordination**: Asynchronous task processing and scheduling
✅ **Persistent Memory**: SQLite-based conversation history and state management
✅ **Interactive UI**: Modern, responsive chat interface
✅ **Error Handling**: Comprehensive error handling and reconnection logic

## Architecture

- **Agent Class**: `AIAgent` extends the Agents SDK `Agent` class
- **State Management**: Built-in Durable Objects state + SQLite database
- **Real-time Communication**: WebSocket connections for instant messaging
- **Workflow Engine**: Scheduled task execution with status tracking
- **Memory System**: Conversation history with intelligent trimming

## Setup & Deployment

1. **Install Dependencies**:
   ```bash
   npm create cloudflare@latest ai-assistant -- --template=cloudflare/agents-starter
   cd ai-assistant
   npm install agents
   ```

2. **Configure wrangler.toml** (see configuration above)

3. **Deploy**:
   ```bash
   npx wrangler@latest deploy
   ```

## API Endpoints

- **WebSocket**: `/websocket` - Real-time chat communication
- **REST API**: `/api/health` - Health check endpoint
- **Sessions**: `/api/sessions` - Create new chat sessions

## Message Types

### Chat Messages
```json
{
  "type": "chat",
  "content": "Hello, AI!",
  "metadata": { "timestamp": 1234567890 }
}
```

### Voice Messages  
```json
{
  "type": "voice",
  "content": "transcribed text",
  "metadata": { "inputType": "voice" }
}
```

### Workflow Requests
```json
{
  "type": "workflow", 
  "content": {
    "type": "data_analysis",
    "payload": { "data": [...] }
  }
}
```

## Key Components

### 🧠 **AI Agent (`AIAgent`)**
- Handles WebSocket connections and messaging
- Integrates with Llama 3.3 for intelligent responses
- Manages conversation context and history
- Executes asynchronous workflows

### 💾 **State Management** 
- Persistent conversation history (last 50 messages)
- User preferences and context storage
- SQLite database for long-term persistence
- Automatic state synchronization

### ⚡ **Workflow Engine**
- Scheduled task execution
- Support for multiple workflow types:
  - LLM queries
  - Data analysis  
  - Web search simulation
  - Custom workflows
- Status tracking and error handling

### 🌐 **Frontend Interface**
- Modern, responsive design
- Real-time message updates
- Typing indicators
- Voice input simulation
- Connection status monitoring

## Scaling & Performance

- **Global Distribution**: Runs on Cloudflare's edge network
- **Auto-scaling**: Durable Objects scale to handle millions of agents
- **Low Latency**: Agent instances run close to users
- **Efficient Memory**: Smart conversation history trimming
- **Persistent State**: SQLite ensures data persistence

## Customization

The agent is highly extensible:
- Add custom workflow types
- Integrate external APIs and databases
- Implement custom AI model integrations
- Add authentication and user management
- Extend the frontend with additional features

## Security Features

- Input validation and sanitization
- Error boundary handling
- Rate limiting (configurable)
- Secure WebSocket connections
- SQL injection prevention

This AI-powered assistant demonstrates the full potential of Cloudflare's Agents SDK, providing a production-ready foundation for building sophisticated AI applications with real-time capabilities, persistent state, and global scalability.