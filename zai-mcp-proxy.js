#!/usr/bin/env node

/**
 * Z.AI MCP Proxy Server
 * 
 * MCP server acting as a proxy for Z.AI Web Search Prime API.
 * Enables integration with Forge as a standard MCP server running through stdio.
 * 
 * Usage:
 * node zai-mcp-proxy.js --api-key=YOUR_API_KEY
 * 
 * Forge configuration:
 * "zai-search": {
 *   "command": "node",
 *   "args": ["/path/to/zai-mcp-proxy.js", "--api-key", "$ZAI_API_KEY"]
 * }
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const https = require('https');
const { URL } = require('url');
const z = require('zod');

// Server configuration
const ZAI_API_URL = 'https://api.z.ai/api/mcp/web_search_prime/mcp';
const PROTOCOL_VERSION = '2024-11-05';

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--api-key=')) {
            config.apiKey = args[i].substring(10);
        } else if (args[i] === '--api-key' && i + 1 < args.length) {
            config.apiKey = args[++i];
        }
    }
    
    // If no API key provided, try to read from environment variable
    if (!config.apiKey) {
        config.apiKey = process.env.ZAI_API_KEY;
    }
    
    return config;
}

// Class to manage Z.AI session
class ZAISessionManager {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.sessionId = null;
        this.isInitialized = false;
    }

    // Execute HTTP request to Z.AI API
    async makeRequest(method, url, headers = {}, data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...headers
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                const jsonData = JSON.stringify(data);
                req.write(jsonData);
            }
            
            req.end();
        });
    }

    // Initialize MCP session
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        const initPayload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {
                    "roots": { "listChanged": true },
                    "sampling": {}
                },
                "clientInfo": {
                    "name": "zai-mcp-proxy",
                    "version": "1.0.0"
                }
            }
        };

        try {
            const response = await this.makeRequest('POST', ZAI_API_URL, {}, initPayload);
            
            // Parse SSE response
            const lines = response.split('\n');
            let jsonMatch = null;
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonData = line.substring(5).trim();
                    if (jsonData) {
                        try {
                            jsonMatch = JSON.parse(jsonData);
                            break;
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                }
            }
            
            if (jsonMatch) {
                const responseData = jsonMatch;
                this.sessionId = responseData.id || "1";
                this.isInitialized = true;
                
                // Send initialized notification
                await this.sendInitializedNotification();
            }
        } catch (error) {
            console.error('Z.AI session initialization error:', error.message);
            throw error;
        }
    }

    // Send initialization complete notification
    async sendInitializedNotification() {
        const notifyPayload = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {}
        };

        try {
            await this.makeRequest('POST', ZAI_API_URL, {
                'Mcp-Session-Id': this.sessionId
            }, notifyPayload);
        } catch (error) {
            console.warn('Warning when sending initialization notification:', error.message);
        }
    }

    // Execute search
    async search(query, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const callPayload = {
            "jsonrpc": "2.0",
            "id": Date.now(),
            "method": "tools/call",
            "params": {
                "name": "webSearchPrime",
                "arguments": {
                    "search_query": query,
                    "content_size": options.contentSize || "medium",
                    "location": options.location || "us"
                }
            }
        };

        try {
            const response = await this.makeRequest('POST', ZAI_API_URL, {
                'Mcp-Session-Id': this.sessionId
            }, callPayload);

            // Parse SSE response
            const lines = response.split('\n');
            let jsonMatch = null;
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonData = line.substring(5).trim();
                    if (jsonData) {
                        try {
                            jsonMatch = JSON.parse(jsonData);
                            break;
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                }
            }
            
            if (jsonMatch && jsonMatch.result && jsonMatch.result.content && jsonMatch.result.content[0]) {
                const textContent = jsonMatch.result.content[0].text;
                
                try {
                    // Check if textContent is double escaped
                    let searchResults;
                    if (textContent.startsWith('"') && textContent.endsWith('"')) {
                        // Double escaped JSON - remove outer quotes and unescape
                        const unescapedText = textContent.slice(1, -1).replace(/\\"/g, '"');
                        searchResults = JSON.parse(unescapedText);
                    } else {
                        // Normal JSON
                        searchResults = JSON.parse(textContent);
                    }
                    
                    return searchResults;
                } catch (parseError) {
                    throw new Error(`JSON parsing error: ${parseError.message}`);
                }
            }
            
            throw new Error('Failed to parse search response');
        } catch (error) {
            console.error('Search error:', error.message);
            throw error;
        }
    }

    // Close session
    async close() {
        if (this.sessionId) {
            try {
                await this.makeRequest('DELETE', ZAI_API_URL, {
                    'Mcp-Session-Id': this.sessionId
                });
            } catch (error) {
                console.warn('Warning when closing session:', error.message);
            }
        }
    }
}

// Main server function
async function main() {
    const config = parseArgs();
    
    if (!config.apiKey) {
        console.error('Error: Missing Z.AI API key');
        console.error('Use --api-key=YOUR_API_KEY or set ZAI_API_KEY environment variable');
        process.exit(1);
    }

    // Initialize session manager
    const sessionManager = new ZAISessionManager(config.apiKey);

    // Create MCP server
    const server = new McpServer({
        name: 'zai-search-proxy',
        version: '1.0.0'
    });

    // Register search tool
    server.registerTool(
        'webSearchPrime',
        {
            title: 'Z.AI Web Search Prime',
            description: 'Z.AI Web Search Prime - fast and accurate search engine',
            inputSchema: z.object({
                search_query: z.string().describe('Search query'),
                content_size: z.enum(['small', 'medium', 'large']).default('medium').describe('Content size of results (default: medium)'),
                location: z.string().default('us').describe('Search location (default: us)')
            })
        },
        async ({ search_query, content_size = 'medium', location = 'us' }) => {
            try {
                const results = await sessionManager.search(search_query, { content_size, location });
                
                // Use API results
                const formattedResults = Array.isArray(results) ? results : [];
                const resultCount = formattedResults.length;
                
                let responseText = `🔍 Found ${resultCount} results for: "${search_query}"\n\n`;
                
                // Add top 5 results
                const topResults = formattedResults.slice(0, 5);
                topResults.forEach((result, index) => {
                    responseText += `${index + 1}. ${result.title || 'No title'}\n`;
                    responseText += `   🔗 ${result.link || 'No link'}\n`;
                    if (result.content) {
                        responseText += `   📝 ${result.content.substring(0, 200)}...\n`;
                    }
                    responseText += '\n';
                });
                
                return {
                    content: [{
                        type: 'text',
                        text: responseText
                    }],
                    _meta: {
                        totalResults: resultCount,
                        query: search_query,
                        source: 'zai-web-search-prime'
                    }
                };
            } catch (error) {
                console.error('webSearchPrime tool error:', error.message);
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Search error: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );

    // Handle process shutdown
    const cleanup = async () => {
        console.error('Closing Z.AI session...');
        await sessionManager.close();
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Start server through stdio
    console.error('Starting Z.AI MCP Proxy Server...');
    
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Z.AI MCP Proxy Server started successfully');
    } catch (error) {
        console.error('Server startup error:', error.message);
        process.exit(1);
    }
}

// Handle global errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('Critical error:', error.message);
        process.exit(1);
    });
}

module.exports = { ZAISessionManager };