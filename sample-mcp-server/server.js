const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        server: 'Sample MCP Server',
        version: '1.0.0',
        description: 'Testing server for Copilot MCP Bridge',
        endpoints: {
            health: '/health',
            mcp: '/mcp',
            status: '/status'
        },
        capabilities: [
            'prompt-enhancement',
            'context-analysis',
            'code-suggestions'
        ]
    });
});

// Main MCP endpoint
app.post('/mcp', (req, res) => {
    try {
        const { prompt, sessionId, userId, timestamp, context, metadata } = req.body;

        console.log('Received MCP request:', {
            prompt: prompt?.substring(0, 100) + '...',
            sessionId,
            userId,
            hasContext: !!context,
            activeFile: context?.activeFile?.path
        });

        // Handle test connection requests
        if (prompt === '__TEST_CONNECTION__') {
            return res.json({
                success: true,
                data: {
                    message: 'Test connection successful',
                    server: 'Sample MCP Server',
                    timestamp: Date.now()
                }
            });
        }

        // Simulate processing delay
        setTimeout(() => {
            // Generate enhanced response based on prompt analysis
            const enhancedPrompt = enhancePrompt(prompt, context);
            const additionalContext = generateAdditionalContext(context);
            const suggestions = generateSuggestions(prompt, context);

            const response = {
                success: true,
                data: {
                    enhancedPrompt,
                    additionalContext,
                    suggestions,
                    metadata: {
                        processingTime: 150 + Math.random() * 100,
                        server: 'Sample MCP Server',
                        model: 'sample-v1',
                        confidence: 0.85 + Math.random() * 0.15,
                        sessionId,
                        timestamp: Date.now()
                    }
                }
            };

            console.log('Sending enhanced response');
            res.json(response);
        }, 100 + Math.random() * 200); // Simulate 100-300ms processing time

    } catch (error) {
        console.error('Error processing MCP request:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PROCESSING_ERROR',
                message: 'Failed to process MCP request',
                details: {
                    error: error.message
                }
            }
        });
    }
});

// Prompt enhancement logic
function enhancePrompt(prompt, context) {
    if (!prompt) return prompt;

    let enhanced = prompt;

    // Add context-specific enhancements
    if (context?.activeFile) {
        const fileExt = context.activeFile.path?.split('.').pop();
        const language = context.activeFile.language;

        if (language) {
            enhanced = `[${language.toUpperCase()} Context] ${enhanced}`;
        }

        // Add file-specific context
        if (fileExt === 'ts' || fileExt === 'js') {
            enhanced += ' (Focus on TypeScript/JavaScript best practices and modern ES6+ features)';
        } else if (fileExt === 'py') {
            enhanced += ' (Focus on Python best practices and PEP 8 compliance)';
        } else if (fileExt === 'java') {
            enhanced += ' (Focus on Java best practices and clean code principles)';
        }
    }

    // Add workspace context
    if (context?.workspaceRoot) {
        enhanced += ` (Working in workspace: ${context.workspaceRoot.split('/').pop() || context.workspaceRoot.split('\\').pop()})`;
    }

    // Add selection context
    if (context?.selection) {
        enhanced += ` (Focusing on selected code: "${context.selection.text?.substring(0, 50)}...")`;
    }

    return enhanced;
}

// Generate additional context
function generateAdditionalContext(context) {
    const contextItems = [];

    if (context?.activeFile) {
        contextItems.push(`📄 **Active File:** \`${context.activeFile.path}\``);

        if (context.activeFile.language) {
            contextItems.push(`🔤 **Language:** ${context.activeFile.language}`);
        }
    }

    if (context?.workspaceRoot) {
        contextItems.push(`📁 **Workspace:** \`${context.workspaceRoot}\``);
    }

    if (context?.openFiles && context.openFiles.length > 0) {
        contextItems.push(`📚 **Open Files:** ${context.openFiles.length} files`);
    }

    if (context?.selection) {
        contextItems.push(`🎯 **Selection:** ${context.selection.text?.length || 0} characters selected`);
    }

    if (contextItems.length === 0) {
        return 'No specific context available. Providing general assistance.';
    }

    return contextItems.join('\n');
}

// Generate suggestions
function generateSuggestions(prompt, context) {
    const suggestions = [];

    // Code-related suggestions
    if (prompt.toLowerCase().includes('function') || prompt.toLowerCase().includes('method')) {
        suggestions.push('Consider adding comprehensive JSDoc/docstring comments');
        suggestions.push('Implement proper error handling and validation');
        suggestions.push('Add unit tests for the new function');
    }

    if (prompt.toLowerCase().includes('class') || prompt.toLowerCase().includes('object')) {
        suggestions.push('Follow SOLID principles in your design');
        suggestions.push('Consider implementing proper encapsulation');
        suggestions.push('Add type annotations for better code clarity');
    }

    if (prompt.toLowerCase().includes('performance') || prompt.toLowerCase().includes('optimize')) {
        suggestions.push('Profile the code to identify bottlenecks');
        suggestions.push('Consider caching strategies if applicable');
        suggestions.push('Look for O(n²) algorithms that can be optimized');
    }

    if (prompt.toLowerCase().includes('security') || prompt.toLowerCase().includes('secure')) {
        suggestions.push('Validate and sanitize all user inputs');
        suggestions.push('Use parameterized queries to prevent SQL injection');
        suggestions.push('Implement proper authentication and authorization');
    }

    // Context-based suggestions
    if (context?.activeFile?.language === 'typescript') {
        suggestions.push('Leverage TypeScript strict mode for better type safety');
        suggestions.push('Use interfaces and type aliases for better code documentation');
    }

    if (context?.activeFile?.language === 'python') {
        suggestions.push('Follow PEP 8 style guidelines');
        suggestions.push('Use type hints for better code clarity');
    }

    // Default suggestions if none match
    if (suggestions.length === 0) {
        suggestions.push('Break down complex problems into smaller functions');
        suggestions.push('Write self-documenting code with clear variable names');
        suggestions.push('Consider edge cases and error scenarios');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            details: {
                timestamp: Date.now()
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
            details: {
                availableEndpoints: ['/health', '/status', '/mcp']
            }
        }
    });
});

// Function to find available port
function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = app.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Try next port
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

// Start server with port conflict handling
async function startServer() {
    try {
        let finalPort = PORT;

        // Try to use the default port first, then find available one
        try {
            const server = app.listen(PORT);
            finalPort = PORT;

            server.on('error', async (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`⚠️  Port ${PORT} is already in use, finding available port...`);
                    finalPort = await findAvailablePort(PORT + 1);
                    console.log(`� Using port ${finalPort} instead`);

                    app.listen(finalPort, () => {
                        printServerInfo(finalPort);
                    });
                } else {
                    throw err;
                }
            });

            server.on('listening', () => {
                printServerInfo(finalPort);
            });

        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️  Port ${PORT} is already in use, finding available port...`);
                finalPort = await findAvailablePort(PORT + 1);
                console.log(`🔄 Using port ${finalPort} instead`);

                app.listen(finalPort, () => {
                    printServerInfo(finalPort);
                });
            } else {
                throw err;
            }
        }

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Print server information
function printServerInfo(port) {
    console.log(`�🚀 Sample MCP Server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📋 Status: http://localhost:${port}/status`);
    console.log(`🤖 MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`\n💡 To use with Copilot MCP Bridge, configure endpoint as:`);
    console.log(`   http://localhost:${port}/mcp`);
    console.log(`\n🛑 Press Ctrl+C to stop the server`);
}

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();