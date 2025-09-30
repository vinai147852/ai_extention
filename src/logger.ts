import * as vscode from 'vscode';
import { Logger, LoggingConfig } from './types';

/**
 * Logger implementation for the Copilot MCP Bridge extension
 * Provides structured logging with configurable levels and output channels
 */
export class ExtensionLogger implements Logger {
  private outputChannel: vscode.OutputChannel;
  private config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.outputChannel = vscode.window.createOutputChannel('Copilot MCP Bridge');
  }

  /**
   * Log debug messages (only shown when debug level is enabled)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.writeLog('DEBUG', message, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.writeLog('INFO', message, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.writeLog('WARN', message, ...args);
    }
  }

  /**
   * Log error messages with optional error object
   */
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      let errorDetails = '';
      if (error) {
        errorDetails = ` | Error: ${error.message}`;
        if (error.stack && this.config.level === 'debug') {
          errorDetails += ` | Stack: ${error.stack}`;
        }
      }
      this.writeLog('ERROR', `${message}${errorDetails}`, ...args);
    }
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: LoggingConfig): void {
    this.config = config;
  }

  /**
   * Show the output channel to the user
   */
  show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear all log output
   */
  clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Dispose of the logger resources
   */
  dispose(): void {
    this.outputChannel.dispose();
  }

  /**
   * Write a formatted log message to the output channel
   */
  private writeLog(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` | Data: ${JSON.stringify(args)}` : '';
    const logMessage = `[${timestamp}] ${level}: ${message}${formattedArgs}`;

    this.outputChannel.appendLine(logMessage);

    // Also log to console in development mode
    if (this.config.level === 'debug') {
      console.log(`[Copilot MCP Bridge] ${logMessage}`);
    }
  }

  /**
   * Check if a message should be logged based on current log level
   */
  private shouldLog(messageLevel: LoggingConfig['level']): boolean {
    const levels: LoggingConfig['level'][] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(messageLevel);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log telemetry events (if enabled)
   */
  logTelemetry(eventName: string, properties: Record<string, any> = {}, measurements: Record<string, number> = {}): void {
    if (!this.config.enableTelemetry) {
      return;
    }

    const telemetryData = {
      eventName,
      timestamp: Date.now(),
      properties: {
        ...properties,
        extensionVersion: this.getExtensionVersion(),
        vscodeVersion: vscode.version
      },
      measurements
    };

    this.debug('Telemetry event recorded', telemetryData);
  }

  /**
   * Get the current extension version
   */
  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension('copilot-mcp-bridge');
    return extension?.packageJSON?.version || 'unknown';
  }

  /**
   * Log MCP request/response for debugging
   */
  logMcpCommunication(direction: 'REQUEST' | 'RESPONSE', data: any, duration?: number): void {
    if (this.config.level === 'debug') {
      const durationText = duration ? ` (${duration}ms)` : '';
      this.debug(`MCP ${direction}${durationText}`, data);
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, metadata);

    if (this.config.enableTelemetry) {
      this.logTelemetry('performance',
        { operation, ...metadata },
        { duration }
      );
    }
  }
}