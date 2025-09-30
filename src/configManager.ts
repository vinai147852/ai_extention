import * as vscode from 'vscode';
import { ExtensionConfig, AuthenticationConfig, McpServerConfig, HttpClientConfig, FeatureConfig, LoggingConfig } from './types';

/**
 * Configuration manager for the Copilot MCP Bridge extension
 * Handles reading and writing extension settings with proper type safety
 */
export class ConfigurationManager {
  private static readonly EXTENSION_ID = 'copilot-mcp-bridge';

  /**
   * Get the complete extension configuration
   */
  public static getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);

    return {
      mcpServer: this.getMcpServerConfig(config),
      authentication: this.getAuthenticationConfig(config),
      httpClient: this.getHttpClientConfig(config),
      features: this.getFeatureConfig(config),
      logging: this.getLoggingConfig(config)
    };
  }

  /**
   * Get MCP server configuration
   */
  private static getMcpServerConfig(config: vscode.WorkspaceConfiguration): McpServerConfig {
    return {
      endpoint: config.get<string>('mcpServer.endpoint', 'http://localhost:3000/mcp'),
      timeout: config.get<number>('mcpServer.timeout', 30000),
      retries: config.get<number>('mcpServer.retries', 2)
    };
  }

  /**
   * Get authentication configuration
   */
  private static getAuthenticationConfig(config: vscode.WorkspaceConfiguration): AuthenticationConfig {
    return {
      type: config.get<'none' | 'bearer' | 'api-key' | 'basic'>('authentication.type', 'none'),
      token: config.get<string>('authentication.token', ''),
      headerName: config.get<string>('authentication.headerName', 'Authorization')
    };
  }

  /**
   * Get HTTP client configuration
   */
  private static getHttpClientConfig(config: vscode.WorkspaceConfiguration): HttpClientConfig {
    return {
      library: config.get<'fetch' | 'axios'>('httpClient.library', 'fetch'),
      userAgent: config.get<string>('httpClient.userAgent', 'VSCode-Copilot-MCP-Bridge/1.0.0')
    };
  }

  /**
   * Get feature configuration
   */
  private static getFeatureConfig(config: vscode.WorkspaceConfiguration): FeatureConfig {
    return {
      enabled: config.get<boolean>('features.enabled', true),
      includeWorkspaceContext: config.get<boolean>('features.includeWorkspaceContext', true),
      includeActiveFile: config.get<boolean>('features.includeActiveFile', true)
    };
  }

  /**
   * Get logging configuration
   */
  private static getLoggingConfig(config: vscode.WorkspaceConfiguration): LoggingConfig {
    return {
      level: config.get<'debug' | 'info' | 'warn' | 'error'>('logging.level', 'info'),
      enableTelemetry: config.get<boolean>('logging.enableTelemetry', false)
    };
  }

  /**
   * Update a specific configuration value
   */
  public static async updateConfig<T>(
    key: string,
    value: T,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
    await config.update(key, value, target);
  }

  /**
   * Validate the current configuration
   */
  public static validateConfig(config: ExtensionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate MCP server endpoint
    if (!config.mcpServer.endpoint) {
      errors.push('MCP server endpoint is required');
    } else if (!this.isValidUrl(config.mcpServer.endpoint)) {
      errors.push('MCP server endpoint must be a valid HTTP or HTTPS URL');
    }

    // Validate timeout
    if (config.mcpServer.timeout < 1000 || config.mcpServer.timeout > 120000) {
      errors.push('MCP server timeout must be between 1000ms and 120000ms');
    }

    // Validate authentication
    if (config.authentication.type !== 'none' && !config.authentication.token) {
      errors.push('Authentication token is required when authentication type is not "none"');
    }

    // Validate retries
    if (config.mcpServer.retries < 0 || config.mcpServer.retries > 5) {
      errors.push('MCP server retries must be between 0 and 5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get authentication token securely from VS Code's secret storage
   */
  public static async getSecureToken(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get('copilot-mcp-bridge.auth-token');
  }

  /**
   * Store authentication token securely in VS Code's secret storage
   */
  public static async storeSecureToken(context: vscode.ExtensionContext, token: string): Promise<void> {
    await context.secrets.store('copilot-mcp-bridge.auth-token', token);
  }

  /**
   * Remove authentication token from secure storage
   */
  public static async removeSecureToken(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete('copilot-mcp-bridge.auth-token');
  }

  /**
   * Listen for configuration changes
   */
  public static onConfigurationChanged(callback: (config: ExtensionConfig) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.EXTENSION_ID)) {
        callback(this.getConfig());
      }
    });
  }
}