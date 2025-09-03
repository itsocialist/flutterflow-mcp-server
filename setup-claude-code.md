# Configure FlutterFlow MCP Server for Claude Code

## Step 1: Update the Configuration Template

First, replace `YOUR_API_TOKEN_HERE` in the config with your actual FlutterFlow API token:

```bash
# Edit the configuration file
sed -i '' 's/YOUR_API_TOKEN_HERE/your_actual_token_here/' claude_desktop_config.json
```

## Step 2: Add to Claude Desktop Configuration

### For macOS:
```bash
# Find your Claude Desktop config directory
CONFIG_DIR="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Backup existing config (if it exists)
if [ -f "$CONFIG_DIR" ]; then
    cp "$CONFIG_DIR" "$CONFIG_DIR.backup"
fi

# Copy our config to Claude Desktop
cp claude_desktop_config.json "$CONFIG_DIR"
```

### For Windows:
```bash
# Claude Desktop config location
CONFIG_DIR="$APPDATA/Claude/claude_desktop_config.json"

# Copy configuration
cp claude_desktop_config.json "$CONFIG_DIR"
```

### For Linux:
```bash
# Claude Desktop config location  
CONFIG_DIR="$HOME/.config/Claude/claude_desktop_config.json"

# Copy configuration
cp claude_desktop_config.json "$CONFIG_DIR"
```

## Step 3: Restart Claude Desktop

After copying the configuration:
1. **Quit Claude Desktop completely**
2. **Restart Claude Desktop**
3. **Start a new conversation**

## Step 4: Test the Integration

In Claude Desktop, you should now have access to these FlutterFlow tools:
- `list_projects` - List all your FlutterFlow projects
- `get_components` - Extract components from a project
- `get_pages` - List all pages in a project
- `get_custom_code` - Get custom actions/functions/widgets
- `get_database_collections` - Extract database schemas
- And 10+ more tools for managing FlutterFlow projects

## Verification

You can verify the setup is working by asking Claude to:
```
"List my FlutterFlow projects"
```

If configured correctly, Claude will use the `list_projects` tool to show your projects.

## Troubleshooting

**If tools don't appear:**
- Check Claude Desktop logs for MCP server errors
- Verify the config file path is correct for your OS
- Ensure the token is valid and you have a paid FlutterFlow subscription
- Make sure you restarted Claude Desktop completely

**Config file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`  
- **Linux**: `~/.config/Claude/claude_desktop_config.json`