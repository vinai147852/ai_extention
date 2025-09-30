import * as vscode from 'vscode';
import {
  McpRequest,
  McpResponse,
  ExtensionConfig,
  Logger,
  ChatSession,
  ChatRequest,
  McpError,
  McpErrorType
} from './types';
import { McpService } from './mcpService';

/**
 * Chat participant for integrating with GitHub Copilot Chat
 * Handles prompt interception and MCP server communication
 */
export class CopilotChatParticipant {
  private mcpService: McpService;
  private config: ExtensionConfig;
  private logger: Logger;
  private sessions: Map<string, ChatSession> = new Map();
  private participant?: vscode.ChatParticipant;

  constructor(mcpService: McpService, config: ExtensionConfig, logger: Logger) {
    this.mcpService = mcpService;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Register the chat participant with VS Code
   */
  register(): vscode.Disposable {
    this.logger.info('Registering Copilot MCP Bridge chat participant');

    // Create the chat participant
    this.participant = vscode.chat.createChatParticipant('copilot-mcp-bridge', this.handleChatRequest.bind(this));

    // Set participant properties
    this.participant.iconPath = vscode.Uri.file('resources/icon.png'); // Optional icon
    this.participant.followupProvider = {
      provideFollowups: this.provideFollowups.bind(this)
    };

    this.logger.info('Chat participant registered successfully');

    return this.participant;
  }

  /**
   * Handle incoming chat requests from Copilot
   */
  private async handleChatRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      // Check if MCP integration is enabled
      if (!this.config.features.enabled) {
        this.logger.debug('MCP integration disabled, passing through original prompt');
        stream.markdown(`**Original prompt:** ${request.prompt}\n\n*Note: MCP integration is currently disabled.*`);
        return;
      }

      this.logger.info('Processing chat request', { prompt: request.prompt.substring(0, 100) });

      // Create or get session
      const session = this.getOrCreateSession(context);

      // Show processing indicator
      stream.progress('Enhancing prompt with MCP server...');

      // Build MCP request
      const mcpRequest = await this.buildMcpRequest(request, session, context);

      // Check for cancellation
      if (token.isCancellationRequested) {
        this.logger.debug('Chat request cancelled');
        return;
      }

      try {
        // Send request to MCP server
        const mcpResponse = await this.mcpService.sendMcpRequest(mcpRequest);

        // Check for cancellation again
        if (token.isCancellationRequested) {
          return;
        }

        // Process and display the response
        await this.handleMcpResponse(mcpResponse, request, stream);

        // Update session activity
        session.lastActivity = Date.now();
        session.messageCount++;

      } catch (error) {
        await this.handleMcpError(error as McpError, request, stream);
      }

    } catch (error) {
      this.logger.error('Unexpected error in chat request handler', error as Error);
      stream.markdown('❌ **Error:** An unexpected error occurred while processing your request.');
    }
  }

  /**
   * Build MCP request from chat request
   */
  private async buildMcpRequest(
    request: vscode.ChatRequest,
    session: ChatSession,
    context: vscode.ChatContext
  ): Promise<McpRequest> {
    const activeEditor = vscode.window.activeTextEditor;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    // Build context information
    const requestContext: McpRequest['context'] = {};

    // Add workspace context if enabled
    if (this.config.features.includeWorkspaceContext && workspaceFolder) {
      requestContext.workspaceRoot = workspaceFolder.uri.fsPath;
      requestContext.openFiles = vscode.workspace.textDocuments
        .filter(doc => !doc.isUntitled)
        .map(doc => doc.uri.fsPath);
    }

    // Add active file context if enabled
    if (this.config.features.includeActiveFile && activeEditor) {
      const document = activeEditor.document;
      requestContext.activeFile = {
        path: document.uri.fsPath,
        language: document.languageId,
        content: document.getText()
      };

      // Add selection if there is one
      const selection = activeEditor.selection;
      if (!selection.isEmpty) {
        requestContext.selection = {
          start: selection.start,
          end: selection.end,
          text: document.getText(selection)
        };
      }
    }

    return {
      prompt: request.prompt,
      sessionId: session.id,
      userId: session.userId,
      timestamp: Date.now(),
      context: requestContext,
      metadata: {
        extensionVersion: this.getExtensionVersion(),
        vscodeVersion: vscode.version,
        copilotVersion: this.getCopilotVersion()
      }
    };
  }

  /**
   * Handle successful MCP response
   */
  private async handleMcpResponse(
    mcpResponse: McpResponse,
    originalRequest: vscode.ChatRequest,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    if (!mcpResponse.success) {
      throw new McpError(
        McpErrorType.SERVER_ERROR,
        mcpResponse.error?.message || 'MCP server returned unsuccessful response'
      );
    }

    const data = mcpResponse.data;

    if (!data) {
      // No enhancement, use original prompt
      stream.markdown(`**Enhanced Prompt:** ${originalRequest.prompt}`);
      return;
    }

    // Display enhanced prompt
    if (data.enhancedPrompt && data.enhancedPrompt !== originalRequest.prompt) {
      stream.markdown(`**Enhanced Prompt:** ${data.enhancedPrompt}\n\n`);
    }

    // Display additional context
    if (data.additionalContext) {
      stream.markdown(`**Additional Context:**\n${data.additionalContext}\n\n`);
    }

    // Display suggestions
    if (data.suggestions && data.suggestions.length > 0) {
      stream.markdown(`**Suggestions:**\n`);
      for (const suggestion of data.suggestions) {
        stream.markdown(`• ${suggestion}\n`);
      }
      stream.markdown('\n');
    }

    // Display metadata if in debug mode
    if (this.config.logging.level === 'debug' && data.metadata) {
      stream.markdown(`**Debug Info:**\n\`\`\`json\n${JSON.stringify(data.metadata, null, 2)}\n\`\`\`\n`);
    }

    this.logger.info('Successfully processed MCP response');
  }

  /**
   * Handle MCP errors gracefully
   */
  private async handleMcpError(
    error: McpError,
    originalRequest: vscode.ChatRequest,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    this.logger.error('MCP request failed', error);

    // Show error to user
    let errorMessage = '❌ **MCP Enhancement Failed**\n\n';

    switch (error.type) {
      case McpErrorType.CONNECTION_ERROR:
        errorMessage += 'Unable to connect to MCP server. Please check your configuration.';
        break;
      case McpErrorType.AUTHENTICATION_ERROR:
        errorMessage += 'Authentication failed. Please check your API credentials.';
        break;
      case McpErrorType.TIMEOUT_ERROR:
        errorMessage += 'Request timed out. The MCP server may be overloaded.';
        break;
      case McpErrorType.RATE_LIMITED:
        errorMessage += 'Rate limit exceeded. Please wait before making another request.';
        break;
      default:
        errorMessage += `Error: ${error.message}`;
    }

    errorMessage += '\n\n**Fallback:** Using original prompt without enhancement.\n\n';
    errorMessage += `**Original Prompt:** ${originalRequest.prompt}`;

    stream.markdown(errorMessage);
  }

  /**
   * Provide follow-up suggestions based on the conversation
   */
  private async provideFollowups(
    result: vscode.ChatResult,
    context: vscode.ChatContext,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatFollowup[]> {
    const followups: vscode.ChatFollowup[] = [
      {
        prompt: 'Can you explain this in more detail?',
        label: '🔍 More details'
      },
      {
        prompt: 'Show me an example implementation',
        label: '💡 Show example'
      },
      {
        prompt: 'What are the best practices for this?',
        label: '⭐ Best practices'
      }
    ];

    // Add configuration followup if there were errors
    if (result.errorDetails) {
      followups.unshift({
        prompt: '@mcp /configure',
        label: '⚙️ Configure MCP settings'
      });
    }

    return followups;
  }

  /**
   * Get or create a chat session
   */
  private getOrCreateSession(context: vscode.ChatContext): ChatSession {
    // Use VS Code's session ID if available, otherwise generate one
    const sessionId = context.history.length > 0
      ? `session-${Date.now()}`
      : `session-${Math.random().toString(36).substr(2, 9)}`;

    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        id: sessionId,
        userId: this.getCurrentUserId(),
        startTime: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0
      };

      this.sessions.set(sessionId, session);
      this.logger.debug('Created new chat session', { sessionId });
    }

    return session;
  }

  /**
   * Get current user ID (simplified - in real implementation you might want to use VS Code's authentication)
   */
  private getCurrentUserId(): string {
    // For now, use a simple identifier based on machine
    return `user-${process.env.USERNAME || process.env.USER || 'unknown'}`;
  }

  /**
   * Get extension version
   */
  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension('copilot-mcp-bridge');
    return extension?.packageJSON?.version || 'unknown';
  }

  /**
   * Get Copilot extension version if available
   */
  private getCopilotVersion(): string | undefined {
    const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
    return copilotExtension?.packageJSON?.version;
  }

  /**
   * Update configuration
   */
  updateConfig(config: ExtensionConfig): void {
    this.config = config;
    this.mcpService.updateConfig(config);
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(sessionId);
        this.logger.debug('Cleaned up old session', { sessionId });
      }
    }
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Dispose of the chat participant
   */
  dispose(): void {
    if (this.participant) {
      this.participant.dispose();
    }
    this.sessions.clear();
    this.logger.info('Chat participant disposed');
  }
}