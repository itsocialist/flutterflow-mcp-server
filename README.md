# FlutterFlow MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A Model Context Protocol (MCP) server for integrating with FlutterFlow's Project API. This server allows programmatic access to FlutterFlow projects, enabling automation of project management tasks through AI assistants like Claude.

> **⚡ Powerful FlutterFlow Automation**: Manage components, pages, custom code, database schemas, and more through natural language commands with Claude or other MCP-compatible AI assistants.

## Features

### Project Management
- **List Projects**: Get all FlutterFlow projects in your account
- **Get Project Files**: List YAML configuration files in a project
- **Download Project YAML**: Download project configuration as base64-encoded zip
- **Validate YAML**: Validate YAML configuration before applying updates
- **Update Project**: Apply YAML configuration changes to projects

### Component & Page Management
- **Get Components**: Extract and list all custom components with their definitions
- **Get Pages**: Extract and list all pages with routes and widget trees
- **Update Component**: Modify specific component properties and behavior
- **Update Page**: Modify page layouts, widgets, and actions

### Custom Code Management
- **Get Custom Code**: Extract all custom actions, functions, and widgets
- **Add Custom Action**: Create new async Dart functions for complex operations
- **Add Custom Function**: Add custom Dart functions for data processing
- **Add Custom Widget**: Create reusable custom Flutter widgets

### Database Management
- **Get Database Collections**: Extract Firestore collections and schema definitions
- **Add Database Collection**: Create new collections with fields and indexes
- **Get App State**: Access app state variables and custom data types

## Prerequisites

- Node.js 18 or higher
- A FlutterFlow account with a paid subscription
- FlutterFlow API token

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flutterflow-mcp-server.git
cd flutterflow-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

1. **Get your FlutterFlow API token:**
   - Log into FlutterFlow
   - Go to Account Settings → API
   - Generate/copy your API token
   - **Note**: Requires a paid FlutterFlow subscription

2. **Configure for Claude Desktop:**
   ```bash
   # Copy the example config
   cp claude_desktop_config.json ~/.config/claude/claude_desktop_config.json
   
   # Edit and add your token
   # Replace "YOUR_API_TOKEN_HERE" with your actual token
   ```

3. **Configure for Claude Code (VS Code):**
   ```bash
   # Add MCP server
   claude mcp add flutterflow --env FLUTTERFLOW_API_TOKEN=your_token -- node /path/to/build/index.js
   ```

### Usage

Once configured, restart Claude Desktop/VS Code and ask:
- "List my FlutterFlow projects"
- "Show me the components in project **MyAppName**" 
- "Extract custom code from **MyAppName**"
- "What database collections are in **MyAppName**?"
- "Find project details for **MyAppName**"

> 💡 **Pro Tip**: You can use either project names ("MyApp") or project IDs - the server will automatically resolve project names to IDs!

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev

# Run tests (if you add them)
npm test

# Lint code
npm run lint
```

## 📁 Project Structure

```
flutterflow-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── flutterflow-api.ts    # FlutterFlow API client
│   └── yaml-utils.ts         # YAML parsing utilities
├── build/                    # Compiled JavaScript
├── claude_desktop_config.json # Example Claude Desktop config
├── setup-claude-code.md      # Claude Code setup guide
└── README.md
```

## API Token

To get your FlutterFlow API token:
1. Log into FlutterFlow
2. Go to Account Settings
3. Navigate to the API section
4. Generate or copy your API token

## Available Tools

### Project Management

**list_projects**
Lists all FlutterFlow projects in your account.

**get_project_files**
Gets the list of YAML configuration files for a specific project.
- `projectId`: The FlutterFlow project ID

**download_project_yaml**
Downloads YAML configuration files for a project as a base64-encoded zip.
- `projectId`: The FlutterFlow project ID
- `fileNames` (optional): Array of specific file names to download

**validate_project_yaml**
Validates YAML configuration before updating a project.
- `projectId`: The FlutterFlow project ID
- `yamlContent`: Base64-encoded zip file containing YAML files

**update_project_yaml**
Updates a FlutterFlow project with new YAML configuration.
- `projectId`: The FlutterFlow project ID  
- `yamlContent`: Base64-encoded zip file containing YAML files
- `commitMessage` (optional): Commit message for the update

### Component & Page Management

**get_project_by_name**
Finds a project by name and returns project details.
- `projectName`: The FlutterFlow project name (case-insensitive)

**get_components**
Extracts and lists all custom components from a project.
- `projectId`: The FlutterFlow project ID
- `projectName` (alternative): The FlutterFlow project name

**get_pages**
Extracts and lists all pages with their routes and definitions.
- `projectId`: The FlutterFlow project ID

**update_component**
Updates a specific component in the project.
- `projectId`: The FlutterFlow project ID
- `componentName`: Name of the component to update
- `updates`: Component updates to apply
- `commitMessage` (optional): Commit message

**update_page**
Updates a specific page in the project.
- `projectId`: The FlutterFlow project ID
- `pageName`: Name of the page to update
- `updates`: Page updates to apply
- `commitMessage` (optional): Commit message

### Custom Code Management

**get_custom_code**
Extracts all custom code (actions, functions, widgets) from a project.
- `projectId`: The FlutterFlow project ID

**add_custom_action**
Adds a new custom action to the project.
- `projectId`: The FlutterFlow project ID
- `actionName`: Name of the custom action
- `actionDefinition`: Action definition including code and parameters
- `commitMessage` (optional): Commit message

**add_custom_function**
Adds a new custom function to the project.
- `projectId`: The FlutterFlow project ID
- `functionName`: Name of the custom function
- `functionDefinition`: Function definition including code and parameters
- `commitMessage` (optional): Commit message

### Database Management

**get_database_collections**
Extracts database collections and schemas from a project.
- `projectId`: The FlutterFlow project ID

**add_database_collection**
Adds a new database collection to the project.
- `projectId`: The FlutterFlow project ID
- `collectionName`: Name of the database collection
- `collectionDefinition`: Collection definition including fields and indexes
- `commitMessage` (optional): Commit message

**get_app_state**
Extracts app state variables and data types from a project.
- `projectId`: The FlutterFlow project ID

## Error Handling

The server includes comprehensive error handling:
- Network timeouts (30 seconds)
- HTTP error responses with detailed messages
- Input validation using Zod schemas
- Proper error propagation to MCP clients

## Security

- API tokens are required and validated
- All requests use HTTPS
- Bearer token authentication
- Input validation and sanitization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Inspired by the FlutterFlow community's need for automation
- Thanks to Anthropic for Claude and the MCP specification

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/flutterflow-mcp-server/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/flutterflow-mcp-server/discussions)
- 📧 **Email**: your-email@example.com

---

**⭐ Star this repo if it helped you automate your FlutterFlow workflows!**