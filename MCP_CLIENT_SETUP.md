# MCP Client Setup Guide

This guide covers how to connect the FlutterFlow MCP Server to various MCP-compatible clients.

## 📋 Prerequisites

1. **Built MCP Server**:
   ```bash
   npm install
   npm run build
   ```

2. **FlutterFlow API Token**:
   - Requires paid FlutterFlow subscription
   - Get from FlutterFlow Account Settings → API

---

## 🎯 Claude Code (VS Code Extension)

### Method 1: CLI Configuration (Recommended)
```bash
# Navigate to your project
cd /path/to/flutterflow-mcp-server

# Add MCP server with CLI
claude mcp add flutterflow \
  --env FLUTTERFLOW_API_TOKEN=your_token_here \
  -- node /path/to/flutterflow-mcp-server/build/index.js
```

### Method 2: Project-Level Configuration
1. **Create `.mcp.json` in your project root**:
   ```json
   {
     "McpServers": {
       "flutterflow": {
         "command": "node",
         "args": ["/absolute/path/to/flutterflow-mcp-server/build/index.js"],
         "env": {
           "FLUTTERFLOW_API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

2. **Open project in VS Code with Claude Code extension**

### Method 3: User-Level Configuration
```bash
# Add to user scope (available across all projects)
claude mcp add flutterflow \
  --scope user \
  --env FLUTTERFLOW_API_TOKEN=your_token_here \
  -- node /path/to/flutterflow-mcp-server/build/index.js
```

**Verify**: Ask Claude "What FlutterFlow tools do you have?"

---

## 🖥️ Claude Desktop

### Configuration
1. **Find Claude Desktop config location**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add/update the config**:
   ```json
   {
     "mcpServers": {
       "flutterflow": {
         "command": "node",
         "args": ["/absolute/path/to/flutterflow-mcp-server/build/index.js"],
         "env": {
           "FLUTTERFLOW_API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop completely**

**Verify**: Start new conversation, ask "List my FlutterFlow projects"

---

## 🎯 Cursor

Cursor supports MCP through VS Code-compatible extensions and configuration.

### Method 1: Via Claude Code Extension
1. **Install Claude Code extension in Cursor**
2. **Follow Claude Code setup steps above**

### Method 2: Direct MCP Configuration
1. **Create workspace `.vscode/settings.json`**:
   ```json
   {
     "claude-code.mcpServers": {
       "flutterflow": {
         "command": "node",
         "args": ["/absolute/path/to/flutterflow-mcp-server/build/index.js"],
         "env": {
           "FLUTTERFLOW_API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

2. **Restart Cursor**

### Method 3: Global Settings
1. **Open Cursor Settings (JSON)**
2. **Add MCP server configuration**:
   ```json
   {
     "mcp.servers": {
       "flutterflow": {
         "command": "node",
         "args": ["/absolute/path/to/flutterflow-mcp-server/build/index.js"],
         "env": {
           "FLUTTERFLOW_API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

**Verify**: Test with AI chat in Cursor

---

## 🌊 Windsurf

Windsurf has built-in MCP support similar to other modern editors.

### Method 1: Workspace Configuration
1. **Create `.windsurf/mcp.json`**:
   ```json
   {
     "servers": {
       "flutterflow": {
         "command": "node",
         "args": ["/absolute/path/to/flutterflow-mcp-server/build/index.js"],
         "env": {
           "FLUTTERFLOW_API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

2. **Reload Windsurf workspace**

### Method 2: Global Configuration
1. **Open Windsurf settings**
2. **Navigate to MCP Servers section**
3. **Add server**:
   - **Name**: `flutterflow`
   - **Command**: `node`
   - **Args**: `/absolute/path/to/flutterflow-mcp-server/build/index.js`
   - **Environment**: `FLUTTERFLOW_API_TOKEN=your_token_here`

### Method 3: Command Palette
1. **Press Cmd/Ctrl + Shift + P**
2. **Search "MCP: Add Server"**
3. **Follow prompts**:
   - Server name: `flutterflow`
   - Command: `node /absolute/path/to/flutterflow-mcp-server/build/index.js`
   - Environment variables: `FLUTTERFLOW_API_TOKEN=your_token_here`

**Verify**: Use AI assistant to test FlutterFlow tools

---

## 🔧 General Troubleshooting

### Common Issues

**1. "FlutterFlow tools not available"**
- Verify MCP server builds: `npm run build`
- Check absolute paths in configuration
- Restart the client completely
- Verify API token is valid

**2. "Permission denied" errors**
- Ensure Node.js is in PATH
- Check file permissions on build directory
- Use absolute paths, not relative paths

**3. "API token invalid"**
- Verify you have a paid FlutterFlow subscription
- Regenerate API token in FlutterFlow settings
- Check for typos in token

**4. "Project not found" errors**
- Use `list_projects` to see available projects
- Check project name spelling (case-insensitive)
- Verify project access permissions

### Debug Mode
Add debug logging to troubleshoot:
```json
{
  "env": {
    "FLUTTERFLOW_API_TOKEN": "your_token_here",
    "DEBUG": "true"
  }
}
```

### Testing Connection
Test the MCP server manually:
```bash
# Test basic connectivity
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
FLUTTERFLOW_API_TOKEN=your_token node build/index.js
```

---

## 🎉 Available Tools

Once connected, you can use these natural language commands:

### Project Management
- "List my FlutterFlow projects"
- "Find project MyApp"
- "Show project files for MyApp"

### Components & Pages
- "Get components from MyApp"
- "Show pages in MyApp" 
- "Update component Button1 in MyApp"

### Custom Code
- "Show custom code in MyApp"
- "Add custom action to MyApp"
- "List custom functions"

### Database
- "Show database collections in MyApp"
- "Get app state from MyApp"
- "Add collection Users to MyApp"

---

## 💡 Pro Tips

1. **Use project names**: "MyApp" instead of complex project IDs
2. **Environment variables**: Store tokens securely, never commit them
3. **Absolute paths**: Always use full paths to avoid issues
4. **Restart clients**: Always restart after configuration changes
5. **Test incrementally**: Start with `list_projects` to verify connection

Need help? Check the [main README](README.md) or open an [issue](https://github.com/itsocialist/flutterflow-mcp-server/issues)!