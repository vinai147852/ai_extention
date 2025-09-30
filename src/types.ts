import * as vscode from 'vscode';

/**
 * Configuration interface for MCP server settings
 */
export interface McpServerConfig {
  endpoint: string;
  timeout: number;
  retries: number;
}

/**
 * Authentication configuration for MCP server
 */
export interface AuthenticationConfig {
  type: 'none' | 'bearer' | 'api-key' | 'basic';
  token: string;
  headerName: string;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  library: 'fetch' | 'axios';
  userAgent: string;
}

/**
 * Feature flags for extension functionality
 */
export interface FeatureConfig {
  enabled: boolean;
  includeWorkspaceContext: boolean;
  includeActiveFile: boolean;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableTelemetry: boolean;
}

/**
 * Complete extension configuration
 */
export interface ExtensionConfig {
  mcpServer: McpServerConfig;
  authentication: AuthenticationConfig;
  httpClient: HttpClientConfig;
  features: FeatureConfig;
  logging: LoggingConfig;
}

/**
 * MCP request payload sent to the server
 */
export interface McpRequest {
  prompt: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  context: {
    workspaceRoot?: string;
    activeFile?: {
      path: string;
      language: string;
      content?: string;
    };
    selection?: {
      start: vscode.Position;
      end: vscode.Position;
      text: string;
    };
    openFiles?: string[];
  };
  metadata: {
    extensionVersion: string;
    vscodeVersion: string;
    copilotVersion?: string;
  };
}

/**
 * MCP server response
 */
export interface McpResponse {
  success: boolean;
  data?: {
    enhancedPrompt?: string;
    additionalContext?: string;
    suggestions?: string[];
    metadata?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Chat participant request from VS Code
 */
export interface ChatRequest {
  prompt: string;
  command?: string;
  references: vscode.ChatPromptReference[];
}

/**
 * Internal session data for tracking chat interactions
 */
export interface ChatSession {
  id: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  messageCount: number;
}

/**
 * HTTP request options for MCP communication
 */
export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: string;
  timeout: number;
}

/**
 * Logger interface for consistent logging across the extension
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
  show(): void;
  dispose(): void;
  updateConfig(config: LoggingConfig): void;
  logMcpCommunication(direction: 'REQUEST' | 'RESPONSE', data: any, duration?: number): void;
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void;
}

/**
 * Extension state interface for managing global state
 */
export interface ExtensionState {
  isActive: boolean;
  chatParticipant?: vscode.ChatParticipant;
  sessions: Map<string, ChatSession>;
  config: ExtensionConfig;
  logger: Logger;
}

/**
 * Error types that can occur during MCP communication
 */
export enum McpErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

/**
 * Custom error class for MCP-related errors
 */
export class McpError extends Error {
  constructor(
    public readonly type: McpErrorType,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'McpError';
  }
}

/**
 * Event data for telemetry and monitoring
 */
export interface TelemetryEvent {
  eventName: string;
  timestamp: number;
  properties: Record<string, any>;
  measurements?: Record<string, number>;
}