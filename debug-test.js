const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing with debug logging...');

const serverProcess = spawn('node', [
    path.join(__dirname, 'zai-mcp-proxy.js'), 
    '--api-key', 'ed492818c1e240eb9bba0739c7907a46.gwOD7USk4Uaj3r74'
], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let response = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('STDOUT:', output);
    response += output;
});

serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.log('STDERR:', output);
    errorOutput += output;
});

// Send test request
const testRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "webSearchPrime",
        arguments: {
            search_query: "prezesi Eurocash CEO zarząd dyrektorzy generalni",
            content_size: "large",
            full_description: true,
            max_results: 3
        }
    }
};

setTimeout(() => {
    console.log('Sending test request...');
    serverProcess.stdin.write(JSON.stringify(testRequest) + '\n');
}, 1000);

setTimeout(() => {
    serverProcess.kill();
    process.exit(0);
}, 10000);