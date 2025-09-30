/**
 * Copilot MCP Bridge Extension
 * 
 * A professional VS Code extension that bridges GitHub Copilot Chat with MCP (Model Context Protocol) servers
 * to enhance AI assistance with custom context and capabilities.
 * 
 * Features:
 * - Intercepts Copilot Chat prompts
 * - Sends prompts to configurable MCP servers
 * - Enhances prompts with additional context
 * - Configurable authentication and HTTP protocols
 * - Professional logging and error handling
 * 
 * @author Your Team
 * @version 1.0.0
 */

import * as vscode from 'vscode';
import { ExtensionConfig, ExtensionState, Logger } from './types';
import { ConfigurationManager } from './configManager';
import { ExtensionLogger } from './logger';
import { McpService } from './mcpService';
import { CopilotChatParticipant } from './chatParticipant';

// Global extension state
let extensionState: ExtensionState | undefined;

/**
 * Extension activation entry point
 * Called when VS Code activates the extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Copilot MCP Bridge: Starting activation...');

  try {
    // Initialize configuration
    const config = ConfigurationManager.getConfig();

    // Initialize logger
    const logger = new ExtensionLogger(config.logging);
    logger.info('Extension activation started', { version: getExtensionVersion() });

    // Validate configuration
    const validation = ConfigurationManager.validateConfig(config);
    if (!validation.isValid) {
      logger.warn('Configuration validation failed', validation.errors);
      await showConfigurationErrors(validation.errors);
    }

    // Initialize MCP service
    const mcpService = new McpService(config, logger);

    // Initialize chat participant
    const chatParticipant = new CopilotChatParticipant(mcpService, config, logger);

    // Initialize extension state
    extensionState = {
      isActive: true,
      sessions: new Map(),
      config,
      logger
    };

    // Register chat participant
    const chatParticipantDisposable = chatParticipant.register();
    context.subscriptions.push(chatParticipantDisposable);

    // Register commands
    registerCommands(context, mcpService, chatParticipant, logger);

    // Register configuration change listener
    const configChangeDisposable = ConfigurationManager.onConfigurationChanged((newConfig) => {
      logger.info('Configuration changed, updating services');
      extensionState!.config = newConfig;
      logger.updateConfig(newConfig.logging);
      mcpService.updateConfig(newConfig);
      chatParticipant.updateConfig(newConfig);
    });
    context.subscriptions.push(configChangeDisposable);

    // Register status bar item
    const statusBarItem = createStatusBarItem(config);
    context.subscriptions.push(statusBarItem);

    // Setup periodic cleanup
    const cleanupInterval = setInterval(() => {
      chatParticipant.cleanupSessions();
    }, 60 * 60 * 1000); // Every hour

    context.subscriptions.push(new vscode.Disposable(() => {
      clearInterval(cleanupInterval);
    }));

    // Show welcome message for first-time users
    await showWelcomeMessage(context, logger);

    logger.info('Extension activated successfully', {
      configValid: validation.isValid,
      mcpEnabled: config.features.enabled
    });

    console.log('Copilot MCP Bridge: Activation complete!');

  } catch (error) {
    console.error('Copilot MCP Bridge: Activation failed:', error);

    // Show error to user
    const errorMessage = `Failed to activate Copilot MCP Bridge: ${(error as Error).message}`;
    vscode.window.showErrorMessage(errorMessage);

    throw error;
  }
}

/**
 * Extension deactivation entry point
 * Called when VS Code deactivates the extension
 */
export function deactivate(): void {
  if (extensionState) {
    extensionState.logger.info('Extension deactivation started');

    // Clean up resources
    extensionState.isActive = false;
    extensionState.sessions.clear();
    extensionState.logger.dispose();

    extensionState = undefined;
  }

  console.log('Copilot MCP Bridge: Deactivated');
}

/**
 * Register extension commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  mcpService: McpService,
  chatParticipant: CopilotChatParticipant,
  logger: Logger
): void {
  // Configure command - opens configuration UI
  const configureCommand = vscode.commands.registerCommand(
    'copilot-mcp-bridge.configure',
    async () => {
      logger.info('Configure command executed');
      await showConfigurationUI();
    }
  );

  // Test connection command
  const testConnectionCommand = vscode.commands.registerCommand(
    'copilot-mcp-bridge.testConnection',
    async () => {
      logger.info('Test connection command executed');
      await testMcpConnection(mcpService, logger);
    }
  );

  // Show logs command
  const showLogsCommand = vscode.commands.registerCommand(
    'copilot-mcp-bridge.showLogs',
    () => {
      logger.show();
    }
  );

  // Toggle extension command
  const toggleCommand = vscode.commands.registerCommand(
    'copilot-mcp-bridge.toggle',
    async () => {
      const currentConfig = ConfigurationManager.getConfig();
      const newEnabled = !currentConfig.features.enabled;

      await ConfigurationManager.updateConfig('features.enabled', newEnabled);

      const status = newEnabled ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`Copilot MCP Bridge ${status}`);
      logger.info(`Extension ${status} via command`);
    }
  );

  // Show status command
  const statusCommand = vscode.commands.registerCommand(
    'copilot-mcp-bridge.showStatus',
    () => {
      const sessionCount = chatParticipant.getActiveSessionCount();
      const config = extensionState!.config;

      const statusMessage = [
        `**Copilot MCP Bridge Status**`,
        ``,
        `🔗 **MCP Server:** ${config.mcpServer.endpoint}`,
        `⚡ **Status:** ${config.features.enabled ? 'Enabled' : 'Disabled'}`,
        `🔐 **Authentication:** ${config.authentication.type}`,
        `📡 **HTTP Client:** ${config.httpClient.library}`,
        `👥 **Active Sessions:** ${sessionCount}`,
        `📊 **Log Level:** ${config.logging.level}`
      ].join('\n');

      vscode.window.showInformationMessage(statusMessage, { modal: true });
    }
  );

  // Register all commands
  context.subscriptions.push(
    configureCommand,
    testConnectionCommand,
    showLogsCommand,
    toggleCommand,
    statusCommand
  );

  logger.info('Commands registered successfully');
}

/**
 * Create status bar item
 */
function createStatusBarItem(config: ExtensionConfig): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.text = config.features.enabled ? '$(cloud) MCP' : '$(cloud-offline) MCP';
  statusBarItem.tooltip = 'Copilot MCP Bridge - Click to toggle';
  statusBarItem.command = 'copilot-mcp-bridge.toggle';
  statusBarItem.show();

  return statusBarItem;
}

/**
 * Show configuration UI
 */
async function showConfigurationUI(): Promise<void> {
  const config = ConfigurationManager.getConfig();

  const options: vscode.QuickPickItem[] = [
    {
      label: '🔗 MCP Server Endpoint',
      description: config.mcpServer.endpoint,
      detail: 'Configure the MCP server URL'
    },
    {
      label: '🔐 Authentication Settings',
      description: config.authentication.type,
      detail: 'Configure authentication method and credentials'
    },
    {
      label: '📡 HTTP Client Settings',
      description: config.httpClient.library,
      detail: 'Configure HTTP client and user agent'
    },
    {
      label: '⚙️ Feature Settings',
      description: config.features.enabled ? 'Enabled' : 'Disabled',
      detail: 'Enable/disable features and context inclusion'
    },
    {
      label: '📊 Logging Settings',
      description: config.logging.level,
      detail: 'Configure logging level and telemetry'
    },
    {
      label: '🧪 Test Connection',
      description: 'Test MCP server connection',
      detail: 'Verify that the MCP server is reachable'
    }
  ];

  const selected = await vscode.window.showQuickPick(options, {
    title: 'Copilot MCP Bridge Configuration',
    placeHolder: 'Select a setting to configure'
  });

  if (selected) {
    switch (selected.label) {
      case '🔗 MCP Server Endpoint':
        await configureMcpEndpoint();
        break;
      case '🔐 Authentication Settings':
        await configureAuthentication();
        break;
      case '🧪 Test Connection':
        if (extensionState) {
          await testMcpConnection(
            new McpService(config, extensionState.logger),
            extensionState.logger
          );
        }
        break;
      default:
        vscode.commands.executeCommand('workbench.action.openSettings', 'copilot-mcp-bridge');
    }
  }
}

/**
 * Configure MCP endpoint
 */
async function configureMcpEndpoint(): Promise<void> {
  const currentEndpoint = ConfigurationManager.getConfig().mcpServer.endpoint;

  const newEndpoint = await vscode.window.showInputBox({
    title: 'MCP Server Endpoint',
    value: currentEndpoint,
    prompt: 'Enter the MCP server URL (http:// or https://)',
    validateInput: (value) => {
      if (!value) { return 'URL is required'; }
      if (!value.match(/^https?:\/\/.+/)) { return 'Must be a valid HTTP or HTTPS URL'; }
      return undefined;
    }
  });

  if (newEndpoint && newEndpoint !== currentEndpoint) {
    await ConfigurationManager.updateConfig('mcpServer.endpoint', newEndpoint);
    vscode.window.showInformationMessage('MCP server endpoint updated');
  }
}

/**
 * Configure authentication
 */
async function configureAuthentication(): Promise<void> {
  const authTypes = [
    { label: 'None', description: 'No authentication', value: 'none' },
    { label: 'Bearer Token', description: 'Authorization: Bearer <token>', value: 'bearer' },
    { label: 'API Key', description: 'Custom header with API key', value: 'api-key' },
    { label: 'Basic Auth', description: 'Basic authentication', value: 'basic' }
  ];

  const selectedAuth = await vscode.window.showQuickPick(authTypes, {
    title: 'Authentication Method',
    placeHolder: 'Select authentication method'
  });

  if (selectedAuth) {
    await ConfigurationManager.updateConfig('authentication.type', selectedAuth.value);

    if (selectedAuth.value !== 'none') {
      const token = await vscode.window.showInputBox({
        title: 'Authentication Token',
        prompt: 'Enter your authentication token',
        password: true
      });

      if (token) {
        await ConfigurationManager.updateConfig('authentication.token', token);
      }
    }

    vscode.window.showInformationMessage('Authentication settings updated');
  }
}

/**
 * Test MCP connection
 */
async function testMcpConnection(mcpService: McpService, logger: Logger): Promise<void> {
  const progress = vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Testing MCP server connection...',
      cancellable: false
    },
    async () => {
      const result = await mcpService.testConnection();

      if (result.success) {
        const message = `✅ Connection successful! Latency: ${result.latency}ms`;
        vscode.window.showInformationMessage(message);
        logger.info('MCP connection test passed', { latency: result.latency });
      } else {
        const message = `❌ Connection failed: ${result.message}`;
        vscode.window.showErrorMessage(message);
        logger.error('MCP connection test failed', undefined, { message: result.message });
      }
    }
  );

  return progress;
}

/**
 * Show configuration errors to the user
 */
async function showConfigurationErrors(errors: string[]): Promise<void> {
  const message = `Configuration errors found:\n${errors.map(e => `• ${e}`).join('\n')}`;

  const action = await vscode.window.showWarningMessage(
    'Copilot MCP Bridge configuration has errors',
    'Fix Now',
    'Ignore'
  );

  if (action === 'Fix Now') {
    vscode.commands.executeCommand('copilot-mcp-bridge.configure');
  }
}

/**
 * Show welcome message for new users
 */
async function showWelcomeMessage(context: vscode.ExtensionContext, logger: Logger): Promise<void> {
  const isFirstRun = context.globalState.get('copilot-mcp-bridge.firstRun', true);

  if (isFirstRun) {
    const action = await vscode.window.showInformationMessage(
      'Welcome to Copilot MCP Bridge! This extension enhances GitHub Copilot with MCP server integration.',
      'Configure Now',
      'Learn More',
      'Dismiss'
    );

    switch (action) {
      case 'Configure Now':
        vscode.commands.executeCommand('copilot-mcp-bridge.configure');
        break;
      case 'Learn More':
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-team/copilot-mcp-bridge'));
        break;
    }

    await context.globalState.update('copilot-mcp-bridge.firstRun', false);
    logger.info('First run welcome message shown');
  }
}

/**
 * Get current extension version
 */
function getExtensionVersion(): string {
  const extension = vscode.extensions.getExtension('copilot-mcp-bridge');
  return extension?.packageJSON?.version || 'unknown';
}