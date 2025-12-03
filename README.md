# Z.AI MCP Proxy Server

Complete MCP proxy server for Z.AI Web Search Prime API that can be integrated with Forge as a standard MCP server running through stdio.

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone https://github.com/dariuszkowalski-com/zai-mcp-proxy-server.git
cd zai-mcp-proxy-server

# Install dependencies
npm install

# Set API key
export ZAI_API_KEY="your_zai_api_key"

# Run server
node zai-mcp-proxy.js
```

### 2. Forge Configuration

Add to your Forge configuration:

```json
{
  "mcpServers": {
    "zai-search": {
      "command": "node",
      "args": ["/path/to/zai-mcp-proxy.js", "--api-key", "$ZAI_API_KEY"]
    }
  }
}
```

## 📋 Requirements

- Node.js 16+
- Z.AI Web Search Prime API key
- Internet access

## 🔧 Tools

### webSearchPrime

Z.AI Web Search Prime search engine.

**Parameters:**
- `search_query` (string, required): Search query
- `content_size` (string, optional): Content size of results (`small`, `medium`, `large`) - default `medium`
- `location` (string, optional): Search location - default `us`

**Usage example:**
```
webSearchPrime("rust programming language", { content_size: "medium", location: "us" })
```

## 🛠️ Technology

- **Node.js** - runtime environment
- **@modelcontextprotocol/sdk** - official MCP SDK
- **Zod** - parameter validation
- **HTTPS** - communication with Z.AI API

## 📁 File Structure

```
zai-mcp-proxy-server/
├── zai-mcp-proxy.js          # Main MCP server
├── package.json              # Project dependencies
├── test-zai-mcp-proxy.js     # Unit tests
├── install-proxy.sh          # Installation script
└── README.md                 # Documentation
```

## 🧪 Testing

```bash
# Run tests
npm test

# Tests check:
# - MCP connection initialization
# - Available tools listing
# - Search execution
# - Result formatting correctness
```

## 🔒 Security

- API key transmitted through secure HTTPS connection
- Validation of all input parameters
- Error handling and timeouts
- No logging of sensitive data

## 📈 Features

- ✅ Full compatibility with MCP Protocol v2024-11-05
- ✅ Communication through stdio
- ✅ Automatic Z.AI session management
- ✅ Search results formatting
- ✅ Error handling and timeouts
- ✅ Configurable search parameters
- ✅ Result metadata (count, source, query)

## 🔄 Installation on Other Computers

### Method 1: Installation Script

```bash
# Download and run script
curl -sSL https://raw.githubusercontent.com/dariuszkowalski-com/zai-mcp-proxy-server/main/install-proxy.sh | bash

# Set API key
export ZAI_API_KEY="your_api_key"
```

### Method 2: Manual Installation

```bash
# 1. Clone repository
git clone https://github.com/dariuszkowalski-com/zai-mcp-proxy-server.git
cd zai-mcp-proxy-server

# 2. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install dependencies
npm install

# 4. Set API key in environment variable or .env file
echo 'export ZAI_API_KEY="your_api_key"' >> ~/.bashrc
source ~/.bashrc

# 5. Test functionality
npm test
```

### Method 3: Docker

```bash
# Build image
docker build -t zai-mcp-proxy .

# Run container
docker run -d --name zai-mcp-proxy \
  -e ZAI_API_KEY="your_api_key" \
  -v /path/to/config:/config \
  zai-mcp-proxy
```

## 🐛 Troubleshooting

### No Search Results
- Check API key: `echo $ZAI_API_KEY`
- Verify internet connection
- Check Z.AI API limits

### Connection Errors
- Ensure Node.js is version 16+
- Check firewall and proxy
- Verify Z.AI API URL

### Forge Integration Issues
- Check path to `zai-mcp-proxy.js` file
- Ensure `ZAI_API_KEY` variable is set
- Check file permissions

## 📄 License

MIT License

## 🤝 Support

For issues:
1. Check error logs
2. Run `npm test`
3. Check Z.AI API documentation
4. Open GitHub issue

---

**Ready to use with Forge!** 🚀