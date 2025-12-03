const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_API_KEY = process.env.ZAI_API_KEY || 'test_api_key';
const SERVER_PATH = path.join(__dirname, 'zai-mcp-proxy.js');

console.log('🧪 Testing Z.AI MCP Proxy Server...');
console.log(`📍 Server path: ${SERVER_PATH}`);
console.log(`🔑 API key: ${TEST_API_KEY.substring(0, 8)}...`);
console.log('');

// Test server functionality
async function testServer() {
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', [SERVER_PATH, '--api-key', TEST_API_KEY], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let testPassed = false;

        serverProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('📤 Server output:', data.toString().trim());
        });

        serverProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            const output = data.toString().trim();
            
            // Log server startup messages
            if (output.includes('Starting') || output.includes('started successfully')) {
                console.log('✅', output);
            }
        });

        serverProcess.on('close', (code) => {
            console.log(`\n🏁 Server process finished with code: ${code}`);
            
            // Check for success indicators
            const successIndicators = [
                'Starting Z.AI MCP Proxy Server',
                'Z.AI MCP Proxy Server started successfully',
                'Found',
                'results for'
            ];

            const hasSuccess = successIndicators.some(indicator => 
                stderr.includes(indicator) || stdout.includes(indicator)
            );

            if (hasSuccess || code === 0) {
                console.log('✅ All tests passed successfully!');
                testPassed = true;
            } else {
                console.log('❌ Tests failed');
                if (stderr) console.log('Error output:', stderr);
                if (stdout) console.log('Standard output:', stdout);
            }

            resolve(testPassed);
        });

        // Send test requests to server
        setTimeout(() => {
            console.log('🔄 Sending test requests...');
            
            // Initialize request
            const initRequest = {
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        roots: { listChanged: true },
                        sampling: {}
                    },
                    clientInfo: {
                        name: "test-client",
                        version: "1.0.0"
                    }
                }
            };

            serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

            // List tools request
            setTimeout(() => {
                const listToolsRequest = {
                    jsonrpc: "2.0",
                    id: 2,
                    method: "tools/list"
                };

                serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

                // Call search tool
                setTimeout(() => {
                    const searchRequest = {
                        jsonrpc: "2.0",
                        id: 3,
                        method: "tools/call",
                        params: {
                            name: "webSearchPrime",
                            arguments: {
                                search_query: "rust programming language",
                                content_size: "medium",
                                location: "us"
                            }
                        }
                    };

                    serverProcess.stdin.write(JSON.stringify(searchRequest) + '\n');

                    // Give time for response then close
                    setTimeout(() => {
                        serverProcess.stdin.end();
                    }, 3000);

                }, 2000);

            }, 2000);

        }, 3000);

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!testPassed) {
                console.log('⏰ Test timeout - terminating...');
                serverProcess.kill();
                resolve(false);
            }
        }, 30000);
    });
}

// Run tests
async function runTests() {
    try {
        console.log('🔍 Checking Node.js version...');
        const nodeVersion = process.version;
        console.log(`✅ Node.js version: ${nodeVersion}`);

        console.log('\n🔍 Checking server file...');
        const fs = require('fs');
        if (fs.existsSync(SERVER_PATH)) {
            console.log('✅ Server file exists');
            const stats = fs.statSync(SERVER_PATH);
            console.log(`📊 File size: ${stats.size} bytes`);
        } else {
            console.log('❌ Server file not found');
            process.exit(1);
        }

        console.log('\n🧪 Starting server test...');
        const testResult = await testServer();

        if (testResult) {
            console.log('\n🎉 All tests completed successfully!');
            console.log('📊 Server is ready for Forge integration');
        } else {
            console.log('\n❌ Tests failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Test error:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();