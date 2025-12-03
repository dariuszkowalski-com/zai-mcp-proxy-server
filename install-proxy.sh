#!/bin/bash

# Z.AI MCP Proxy Server Installation Script
# This script installs and configures the Z.AI MCP Proxy Server

set -e

echo "🚀 Installing Z.AI MCP Proxy Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "❌ Homebrew is not installed. Please install Homebrew first."
            echo "Visit: https://brew.sh/"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install Node.js manually."
        exit 1
    fi
fi

echo "✅ Node.js version: $(node --version)"

# Create installation directory
INSTALL_DIR="$HOME/.local/share/zai-mcp-proxy"
mkdir -p "$INSTALL_DIR"

# Download server files
echo "📥 Downloading Z.AI MCP Proxy Server..."
if command -v curl &> /dev/null; then
    curl -fsSL https://raw.githubusercontent.com/dariuszkowalski-com/zai-mcp-proxy-server/main/zai-mcp-proxy.js -o "$INSTALL_DIR/zai-mcp-proxy.js"
    curl -fsSL https://raw.githubusercontent.com/dariuszkowalski-com/zai-mcp-proxy-server/main/package.json -o "$INSTALL_DIR/package.json"
    curl -fsSL https://raw.githubusercontent.com/dariuszkowalski-com/zai-mcp-proxy-server/main/test-zai-mcp-proxy.js -o "$INSTALL_DIR/test-zai-mcp-proxy.js"
else
    echo "❌ curl is not installed. Please install curl first."
    exit 1
fi

# Make executable
chmod +x "$INSTALL_DIR/zai-mcp-proxy.js"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install

# Create symlink
echo "🔗 Creating symlink..."
mkdir -p "$HOME/.local/bin"
ln -sf "$INSTALL_DIR/zai-mcp-proxy.js" "$HOME/.local/bin/zai-mcp-proxy"

# Update PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    echo "✅ Added ~/.local/bin to PATH. Please restart your terminal or run:"
    echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set your Z.AI API key:"
echo "   export ZAI_API_KEY=\"your_api_key_here\""
echo ""
echo "2. Add to ~/.bashrc or ~/.zshrc for persistence:"
echo "   echo 'export ZAI_API_KEY=\"your_api_key_here\"' >> ~/.bashrc"
echo ""
echo "3. Test the server:"
echo "   cd $INSTALL_DIR && npm test"
echo ""
echo "4. Configure Forge:"
echo "   \"zai-search\": {"
echo "     \"command\": \"node\","
echo "     \"args\": [\"$INSTALL_DIR/zai-mcp-proxy.js\", \"--api-key\", \"\$ZAI_API_KEY\"]"
echo "   }"
echo ""
echo "🔗 For more information: https://github.com/dariuszkowalski-com/zai-mcp-proxy-server"