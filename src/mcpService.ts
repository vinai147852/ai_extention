import * as vscode from 'vscode';
import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  McpRequest,
  McpResponse,
  ExtensionConfig,
  McpError,
  McpErrorType,
  Logger,
  HttpRequestOptions
} from './types';

/**
 * Service class for communicating with MCP servers
 * Supports both fetch and axios HTTP clients with configurable authentication
 */
export class McpService {
  private config: ExtensionConfig;
  private logger: Logger;
  private abortController?: AbortController;

  constructor(config: ExtensionConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Send a request to the MCP server with enhanced prompt data
   */
  async sendMcpRequest(mcpRequest: McpRequest): Promise<McpResponse> {
    if (!this.config.features.enabled) {
      this.logger.debug('MCP integration is disabled');
      return { success: true, data: { enhancedPrompt: mcpRequest.prompt } };
    }

    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | undefined;

    // Retry logic
    while (attempt <= this.config.mcpServer.retries) {
      try {
        this.logger.debug(`MCP request attempt ${attempt + 1}`, {
          sessionId: mcpRequest.sessionId,
          endpoint: this.config.mcpServer.endpoint
        });

        const response = await this.makeHttpRequest(mcpRequest);
        const duration = Date.now() - startTime;

        this.logger.logMcpCommunication('RESPONSE', response, duration);
        this.logger.logPerformance('mcp-request', duration, {
          attempt: attempt + 1,
          success: true
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        this.logger.warn(`MCP request failed on attempt ${attempt}`, lastError);

        if (attempt <= this.config.mcpServer.retries) {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.delay(delay);
        }
      }
    }

    // All attempts failed
    const duration = Date.now() - startTime;
    this.logger.error('MCP request failed after all retries', lastError);
    this.logger.logPerformance('mcp-request', duration, {
      attempt,
      success: false
    });

    throw this.handleError(lastError!);
  }

  /**
   * Make the actual HTTP request using the configured client
   */
  private async makeHttpRequest(mcpRequest: McpRequest): Promise<McpResponse> {
    this.logger.logMcpCommunication('REQUEST', mcpRequest);

    const options: HttpRequestOptions = {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(mcpRequest),
      timeout: this.config.mcpServer.timeout
    };

    if (this.config.httpClient.library === 'axios') {
      return await this.makeAxiosRequest(options);
    } else {
      return await this.makeFetchRequest(options);
    }
  }

  /**
   * Make HTTP request using axios
   */
  private async makeAxiosRequest(options: HttpRequestOptions): Promise<McpResponse> {
    try {
      const response: AxiosResponse<McpResponse> = await axios({
        method: options.method,
        url: this.config.mcpServer.endpoint,
        headers: options.headers,
        data: options.body,
        timeout: options.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw this.handleAxiosError(error);
      }
      throw error;
    }
  }

  /**
   * Make HTTP request using fetch API
   */
  private async makeFetchRequest(options: HttpRequestOptions): Promise<McpResponse> {
    // Create abort controller for timeout
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, options.timeout);

    try {
      const response = await fetch(this.config.mcpServer.endpoint, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: this.abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new McpError(
          McpErrorType.SERVER_ERROR,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json() as McpResponse;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new McpError(McpErrorType.TIMEOUT_ERROR, 'Request timed out');
      }

      throw error;
    }
  }

  /**
   * Build HTTP headers for the request
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.config.httpClient.userAgent,
      'X-VS-Code-Version': vscode.version,
      'X-Extension-Version': this.getExtensionVersion()
    };

    // Add authentication header if configured
    if (this.config.authentication.type !== 'none' && this.config.authentication.token) {
      switch (this.config.authentication.type) {
        case 'bearer':
          headers[this.config.authentication.headerName] = `Bearer ${this.config.authentication.token}`;
          break;
        case 'api-key':
          headers[this.config.authentication.headerName] = this.config.authentication.token;
          break;
        case 'basic':
          headers[this.config.authentication.headerName] = `Basic ${Buffer.from(this.config.authentication.token).toString('base64')}`;
          break;
      }
    }

    return headers;
  }

  /**
   * Handle axios-specific errors
   */
  private handleAxiosError(error: AxiosError): McpError {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new McpError(McpErrorType.CONNECTION_ERROR, 'Unable to connect to MCP server');
    }

    if (error.code === 'ECONNABORTED') {
      return new McpError(McpErrorType.TIMEOUT_ERROR, 'Request timed out');
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return new McpError(McpErrorType.AUTHENTICATION_ERROR, 'Authentication failed');
    }

    if (error.response?.status === 429) {
      return new McpError(McpErrorType.RATE_LIMITED, 'Rate limit exceeded');
    }

    return new McpError(
      McpErrorType.SERVER_ERROR,
      error.message,
      { status: error.response?.status, code: error.code }
    );
  }

  /**
   * Handle generic errors and convert them to McpError
   */
  private handleError(error: Error): McpError {
    if (error instanceof McpError) {
      return error;
    }

    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return new McpError(McpErrorType.CONNECTION_ERROR, 'Network request failed');
    }

    return new McpError(McpErrorType.SERVER_ERROR, error.message);
  }

  /**
   * Test connection to MCP server
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      // Create a simple test request
      const testRequest: McpRequest = {
        prompt: '__TEST_CONNECTION__',
        sessionId: 'test',
        userId: 'test',
        timestamp: Date.now(),
        context: {},
        metadata: {
          extensionVersion: this.getExtensionVersion(),
          vscodeVersion: vscode.version
        }
      };

      await this.sendMcpRequest(testRequest);
      const latency = Date.now() - startTime;

      return {
        success: true,
        message: 'Connection successful',
        latency
      };
    } catch (error) {
      const mcpError = error instanceof McpError ? error : this.handleError(error as Error);
      return {
        success: false,
        message: `Connection failed: ${mcpError.message}`
      };
    }
  }

  /**
   * Update the service configuration
   */
  updateConfig(config: ExtensionConfig): void {
    this.config = config;
  }

  /**
   * Cancel ongoing requests
   */
  cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * Get current extension version
   */
  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension('copilot-mcp-bridge');
    return extension?.packageJSON?.version || 'unknown';
  }

  /**
   * Simple delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of service resources
   */
  dispose(): void {
    this.cancelRequests();
  }
}