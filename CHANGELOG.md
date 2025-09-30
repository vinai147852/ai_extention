# Changelog

All notable changes to the "Copilot MCP Bridge" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-29

### Added
- Initial release of Copilot MCP Bridge extension
- GitHub Copilot Chat integration with `@mcp` participant
- MCP (Model Context Protocol) server communication
- Support for multiple HTTP clients (fetch, axios)
- Configurable authentication methods (none, bearer, api-key, basic)
- Workspace and active file context inclusion
- Professional logging system with configurable levels
- Real-time configuration updates
- Connection testing functionality
- Graceful error handling and fallback
- Comprehensive documentation and setup guide
- Sample MCP server for testing
- Status bar integration
- Command palette commands
- Session management and cleanup
- Anonymous telemetry support (opt-in)

### Configuration Options
- MCP server endpoint and timeout settings
- Authentication configuration
- HTTP client library selection
- Feature toggles for context inclusion
- Logging level and telemetry controls

### Commands
- `Copilot MCP Bridge: Configure MCP Server Settings`
- `Copilot MCP Bridge: Test MCP Server Connection`
- `Copilot MCP Bridge: Show Logs`
- `Copilot MCP Bridge: Toggle Extension`
- `Copilot MCP Bridge: Show Status`

### Developer Features
- TypeScript implementation with full type safety
- ESLint configuration for code quality
- VS Code debugging configuration
- Comprehensive test framework setup
- Professional project structure
- Team-ready deployment configuration

## [Unreleased]

### Planned Features
- Multi-MCP server support
- Custom prompt templates
- Response caching
- Advanced telemetry dashboard
- Integration with popular MCP servers
- Enhanced error recovery
- Performance optimizations