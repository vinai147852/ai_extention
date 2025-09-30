# Copilot MCP Bridge

A professional VS Code extension that bridges GitHub Copilot Chat with MCP (Model Context Protocol) servers to enhance AI assistance with custom context and capabilities.

## 🚀 Features

- **Seamless Integration**: Intercepts GitHub Copilot Chat prompts and enhances them via MCP servers
- **Configurable Endpoints**: Connect to any MCP server with customizable HTTP protocols
- **Multiple Authentication Methods**: Support for Bearer tokens, API keys, Basic auth, and custom headers
- **Flexible HTTP Clients**: Choose between fetch API or axios for HTTP communication
- **Professional Logging**: Comprehensive logging with configurable levels and telemetry
- **Context Awareness**: Automatically includes workspace and active file context
- **Error Handling**: Graceful fallback to original prompts when MCP servers are unavailable
- **Real-time Configuration**: Hot-reload configuration changes without restart
- **Team Ready**: Professional settings and deployment configurations

## 📋 Requirements

- **VS Code**: Version 1.85.0 or higher
- **GitHub Copilot**: Extension must be installed and activated
- **Node.js**: Version 18 or higher (for development)
- **MCP Server**: A compatible MCP server endpoint

## 🔧 Installation

### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (Ctrl/Cmd + Shift + X)
3. Search for "Copilot MCP Bridge"
4. Click Install

### Manual Installation

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Run command: `Extensions: Install from VSIX...`
4. Select the downloaded `.vsix` file

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-team/copilot-mcp-bridge.git
   cd copilot-mcp-bridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Package the extension:
   ```bash
   npm run package
   ```

## ⚙️ Configuration

### Quick Setup

1. Install and activate the extension
2. Open Command Palette (Ctrl/Cmd + Shift + P)
3. Run: `Copilot MCP Bridge: Configure MCP Server Settings`
4. Follow the configuration wizard

### Manual Configuration

Open VS Code settings (`Ctrl/Cmd + ,`) and search for "Copilot MCP Bridge" or edit your `settings.json`:

```json
{
  "copilot-mcp-bridge.mcpServer.endpoint": "https://your-mcp-server.com/api/mcp",
  "copilot-mcp-bridge.mcpServer.timeout": 30000,
  "copilot-mcp-bridge.mcpServer.retries": 2,
  "copilot-mcp-bridge.authentication.type": "bearer",
  "copilot-mcp-bridge.authentication.token": "your-api-token",
  "copilot-mcp-bridge.authentication.headerName": "Authorization",
  "copilot-mcp-bridge.httpClient.library": "fetch",
  "copilot-mcp-bridge.httpClient.userAgent": "VSCode-Copilot-MCP-Bridge/1.0.0",
  "copilot-mcp-bridge.features.enabled": true,
  "copilot-mcp-bridge.features.includeWorkspaceContext": true,
  "copilot-mcp-bridge.features.includeActiveFile": true,
  "copilot-mcp-bridge.logging.level": "info",
  "copilot-mcp-bridge.logging.enableTelemetry": false
}
```

## 🎯 Usage

### Basic Usage

1. **Configure your MCP server** using the steps above
2. **Open any file** in VS Code
3. **Start a Copilot Chat** (Ctrl/Cmd + I or open the Chat panel)
4. **Use the `@mcp` participant** in your chat:
   ```
   @mcp Help me optimize this function for better performance
   ```

### Available Commands

Access these commands via Command Palette (Ctrl/Cmd + Shift + P):

- `Copilot MCP Bridge: Configure MCP Server Settings` - Open configuration wizard
- `Copilot MCP Bridge: Test MCP Server Connection` - Verify server connectivity
- `Copilot MCP Bridge: Show Logs` - Open extension logs
- `Copilot MCP Bridge: Toggle Extension` - Enable/disable the extension
- `Copilot MCP Bridge: Show Status` - Display current status and statistics

### Chat Participant Features

The `@mcp` chat participant provides enhanced AI assistance by:

- **Sending your prompt** to the configured MCP server
- **Including workspace context** (if enabled)
- **Adding active file content** (if enabled)
- **Receiving enhanced suggestions** from the MCP server
- **Displaying additional context** and recommendations
- **Graceful fallback** to original prompt if MCP server is unavailable

### Example Interactions

```
@mcp Analyze this code for security vulnerabilities

@mcp Generate unit tests for the current function

@mcp Suggest refactoring improvements for this class

@mcp Help me implement error handling for this API call
```

## 🔑 Authentication Methods

### None
No authentication required:
```json
{
  "copilot-mcp-bridge.authentication.type": "none"
}
```

### Bearer Token
Standard OAuth/JWT token:
```json
{
  "copilot-mcp-bridge.authentication.type": "bearer",
  "copilot-mcp-bridge.authentication.token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### API Key
Custom API key header:
```json
{
  "copilot-mcp-bridge.authentication.type": "api-key",
  "copilot-mcp-bridge.authentication.token": "sk-1234567890abcdef",
  "copilot-mcp-bridge.authentication.headerName": "X-API-Key"
}
```

### Basic Authentication
Username:password encoded:
```json
{
  "copilot-mcp-bridge.authentication.type": "basic",
  "copilot-mcp-bridge.authentication.token": "username:password"
}
```

## 🌐 MCP Server Integration

### Request Format

The extension sends requests to your MCP server in this format:

```json
{
  "prompt": "User's original prompt",
  "sessionId": "unique-session-identifier",
  "userId": "user-identifier",
  "timestamp": 1640995200000,
  "context": {
    "workspaceRoot": "/path/to/workspace",
    "activeFile": {
      "path": "/path/to/file.ts",
      "language": "typescript",
      "content": "file content..."
    },
    "selection": {
      "start": { "line": 10, "character": 0 },
      "end": { "line": 15, "character": 20 },
      "text": "selected text"
    },
    "openFiles": ["/path/to/file1.ts", "/path/to/file2.js"]
  },
  "metadata": {
    "extensionVersion": "1.0.0",
    "vscodeVersion": "1.85.0",
    "copilotVersion": "1.80.0"
  }
}
```

### Response Format

Your MCP server should respond with:

```json
{
  "success": true,
  "data": {
    "enhancedPrompt": "Enhanced version of the original prompt",
    "additionalContext": "Extra context or information",
    "suggestions": ["suggestion 1", "suggestion 2"],
    "metadata": {
      "processingTime": 150,
      "model": "gpt-4",
      "confidence": 0.95
    }
  }
}
```

### Error Response

For errors, respond with:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

## 📊 Configuration Reference

### MCP Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mcpServer.endpoint` | string | `http://localhost:3000/mcp` | MCP server URL |
| `mcpServer.timeout` | number | `30000` | Request timeout in milliseconds |
| `mcpServer.retries` | number | `2` | Number of retry attempts |

### Authentication Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `authentication.type` | enum | `none` | Auth method: `none`, `bearer`, `api-key`, `basic` |
| `authentication.token` | string | `""` | Authentication token |
| `authentication.headerName` | string | `Authorization` | Custom header name |

### HTTP Client Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `httpClient.library` | enum | `fetch` | HTTP library: `fetch`, `axios` |
| `httpClient.userAgent` | string | `VSCode-Copilot-MCP-Bridge/1.0.0` | User agent string |

### Feature Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `features.enabled` | boolean | `true` | Enable/disable MCP integration |
| `features.includeWorkspaceContext` | boolean | `true` | Include workspace info in requests |
| `features.includeActiveFile` | boolean | `true` | Include active file content |

### Logging Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `logging.level` | enum | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `logging.enableTelemetry` | boolean | `false` | Enable anonymous telemetry |

## 🛠️ Development

### Prerequisites

- Node.js 18+
- VS Code 1.85.0+
- Git

### Setup Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-team/copilot-mcp-bridge.git
   cd copilot-mcp-bridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Open in VS Code:**
   ```bash
   code .
   ```

### Building and Testing

1. **Compile TypeScript:**
   ```bash
   npm run compile
   ```

2. **Watch for changes:**
   ```bash
   npm run watch
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Lint code:**
   ```bash
   npm run lint
   ```

### Debugging

1. Press `F5` to start debugging
2. A new Extension Development Host window will open
3. Test the extension in the new window
4. Set breakpoints in the source code for debugging

### Packaging for Distribution

1. **Install VSCE:**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Package the extension:**
   ```bash
   npm run package
   ```

3. **Publish to marketplace:**
   ```bash
   vsce publish
   ```

## 🔍 Troubleshooting

### Common Issues

#### Extension Not Activating
- **Check VS Code version**: Ensure you're running VS Code 1.85.0+
- **Check GitHub Copilot**: Verify Copilot extension is installed and working
- **Check logs**: Run "Copilot MCP Bridge: Show Logs" command

#### MCP Server Connection Failures
- **Test connection**: Use "Test MCP Server Connection" command
- **Check endpoint URL**: Verify the MCP server URL is correct and accessible
- **Check authentication**: Ensure credentials are valid
- **Check firewall**: Verify network connectivity

#### Sample MCP Server Issues

##### Port Already in Use (EADDRINUSE)
If you get `Error: listen EADDRINUSE: address already in use :::3000`:

**Solution 1: Automatic Port Detection (Recommended)**
The server now automatically finds available ports. Just restart and it will use the next available port (3001, 3002, etc.).

**Solution 2: Kill Existing Process**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or use the npm script
npm run stop
```

**Solution 3: Use Different Port**
Set environment variable:
```bash
PORT=3001 npm start
```

**Solution 4: Use the Management Tool**
```bash
# Windows
manage-server.bat

# Or use npm scripts
npm run restart  # Automatically stops and starts
```

##### Server Not Responding
- **Check if running**: `curl http://localhost:3000/health` or `http://localhost:3001/health`
- **Check logs**: The server shows which port it's using in the startup message
- **Restart server**: Use `npm run restart` or the management tool

#### Configuration Issues
- **Validate settings**: The extension validates configuration on startup
- **Check JSON syntax**: Ensure settings.json has valid JSON
- **Reset to defaults**: Remove custom settings to use defaults

### Debug Mode

Enable debug logging for detailed troubleshooting:

```json
{
  "copilot-mcp-bridge.logging.level": "debug"
}
```

### Getting Help

1. **Check logs**: Output panel → "Copilot MCP Bridge"
2. **Test connection**: Use the built-in connection test
3. **Check configuration**: Verify all settings are correct
4. **Create an issue**: [GitHub Issues](https://github.com/your-team/copilot-mcp-bridge/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Copilot Chat API](https://code.visualstudio.com/api/extension-guides/chat)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Extension Development Guide](https://code.visualstudio.com/api/get-started/your-first-extension)

## 🏆 Acknowledgments

- GitHub Copilot team for the excellent Chat API
- VS Code team for the robust extension platform
- MCP community for the protocol specification
- Contributors and users of this extension

---

**Made with ❤️ for better AI-assisted development**