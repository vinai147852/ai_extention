# Sample MCP Server

This directory contains a sample MCP server implementation for testing the Copilot MCP Bridge extension.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd sample-mcp-server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Configure the extension** to use `http://localhost:3000/mcp`

## Features

- Basic prompt enhancement
- Context-aware responses
- Health check endpoint
- Error handling examples
- Authentication support

## API Endpoints

- `POST /mcp` - Main MCP endpoint
- `GET /health` - Health check
- `GET /status` - Server status

## Testing

Use the built-in connection test in the VS Code extension or make direct HTTP requests:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Help me write a function",
    "sessionId": "test",
    "userId": "test",
    "timestamp": 1640995200000,
    "context": {},
    "metadata": {}
  }'
```