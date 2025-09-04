/**
 * LEVEL 3: MCP Client Integration Tests
 * 
 * These tests run the actual MCP server as a subprocess and connect to it
 * using the MCP protocol, testing the full MCP communication stack.
 * 
 * Run with: REAL_API=true FLUTTERFLOW_API_TOKEN=your_token npm run test:mcp-integration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const SKIP_MCP_TESTS = !process.env.REAL_API || !process.env.FLUTTERFLOW_API_TOKEN;
const TEST_PROJECT_NAME = process.env.TEST_PROJECT_NAME || 'MCP-Test-Project';

(SKIP_MCP_TESTS ? describe.skip : describe)('MCP Client Integration Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    if (SKIP_MCP_TESTS) {
      console.log('Skipping MCP integration tests. Set REAL_API=true and FLUTTERFLOW_API_TOKEN to run.');
      return;
    }

    // Ensure the server is built
    const serverPath = path.join(process.cwd(), 'build', 'index.js');
    try {
      await fs.access(serverPath);
    } catch {
      throw new Error('MCP server not built. Run: npm run build');
    }

    // Create transport and client (SDK will manage the subprocess)
    console.log('Starting MCP server...');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        FLUTTERFLOW_API_TOKEN: process.env.FLUTTERFLOW_API_TOKEN,
      },
    } as any);

    client = new Client({
      name: 'mcp-integration-test',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MCP server');

    // Give server time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    if (client && transport) {
      try {
        await client.close();
      } catch (error) {
        console.warn('Error closing client:', error);
      }
    }
  }, 10000);

  describe('MCP Protocol Communication', () => {
    it('should list available tools', async () => {
      const response: any = await client.request(
        { method: 'tools/list', params: {} } as any,
        {} as any
      );

      expect(response.tools).toBeDefined();
      expect(Array.isArray(response.tools)).toBe(true);
      expect(response.tools.length).toBeGreaterThan(10);

      // Check for key tools
      const toolNames = response.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_projects');
      expect(toolNames).toContain('get_project_by_name');
      expect(toolNames).toContain('get_components');
      expect(toolNames).toContain('get_pages');
      expect(toolNames).toContain('get_custom_code');

      console.log(`MCP server provides ${response.tools.length} tools:`, toolNames.slice(0, 5));
    }, 10000);

    it('should call list_projects tool', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'list_projects',
          arguments: {},
        } } as any,
        {} as any
      );

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');

      const projects = JSON.parse(response.content[0].text);
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty('projectId');
      expect(projects[0]).toHaveProperty('name');

      console.log(`Found ${projects.length} projects via MCP`);
    }, 15000);

    it('should call get_project_by_name tool', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_project_by_name',
          arguments: {
            projectName: TEST_PROJECT_NAME,
          },
        } } as any,
        {} as any
      );

      expect(response.content).toBeDefined();
      expect(response.content[0]).toHaveProperty('type', 'text');

      const project = JSON.parse(response.content[0].text);
      expect(project).toBeDefined();
      expect(project.name).toBe(TEST_PROJECT_NAME);
      expect(project).toHaveProperty('projectId');

      console.log(`Found test project via MCP: ${project.projectId}`);
    }, 15000);
  });

  describe('FlutterFlow Project Analysis via MCP', () => {
    let testProjectId: string;

    beforeAll(async () => {
      // Get test project ID via MCP
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_project_by_name',
          arguments: { projectName: TEST_PROJECT_NAME },
        } } as any,
        {} as any
      );

      const project = JSON.parse(response.content[0].text);
      testProjectId = project.projectId;
    });

    it('should get project files via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_project_files',
          arguments: { projectId: testProjectId },
        } } as any,
        {} as any
      );

      const files = JSON.parse(response.content[0].text);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      expect(files).toContain('app-details'); // FlutterFlow uses partition names

      console.log(`Project has ${files.length} files via MCP`);
    }, 15000);

    it('should get components using project name via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_components',
          arguments: { projectName: TEST_PROJECT_NAME }, // Using name instead of ID
        } } as any,
        {} as any
      );

      const components = JSON.parse(response.content[0].text);
      expect(Array.isArray(components)).toBe(true);

      console.log(`Found ${components.length} components via MCP`);
      if (components.length > 0) {
        expect(components[0]).toHaveProperty('name');
        expect(components[0]).toHaveProperty('filename');
        expect(components[0]).toHaveProperty('definition');
        console.log(`First component: ${components[0].name}`);
      }
    }, 20000);

    it('should get pages using project name via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_pages',
          arguments: { projectName: TEST_PROJECT_NAME },
        } } as any,
        {} as any
      );

      const pages = JSON.parse(response.content[0].text);
      expect(Array.isArray(pages)).toBe(true);

      console.log(`Found ${pages.length} pages via MCP`);
      if (pages.length > 0) {
        expect(pages[0]).toHaveProperty('name');
        expect(pages[0]).toHaveProperty('route');
        console.log(`First page: ${pages[0].name} (${pages[0].route})`);
      }
    }, 20000);

    it('should get custom code via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_custom_code',
          arguments: { projectName: TEST_PROJECT_NAME },
        } } as any,
        {} as any
      );

      const customCode = JSON.parse(response.content[0].text);
      expect(customCode).toHaveProperty('actions');
      expect(customCode).toHaveProperty('functions');  
      expect(customCode).toHaveProperty('widgets');

      console.log(`Custom code via MCP:
        - Actions: ${customCode.actions.length}
        - Functions: ${customCode.functions.length}
        - Widgets: ${customCode.widgets.length}`);
    }, 20000);

    it('should get database collections via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_database_collections',
          arguments: { projectName: TEST_PROJECT_NAME },
        } } as any,
        {} as any
      );

      const collections = JSON.parse(response.content[0].text);
      expect(Array.isArray(collections)).toBe(true);

      console.log(`Found ${collections.length} database collections via MCP`);
      if (collections.length > 0) {
        expect(collections[0]).toHaveProperty('name');
        expect(collections[0]).toHaveProperty('definition');
        console.log(`First collection: ${collections[0].name}`);
      }
    }, 20000);

    it('should get app state via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_app_state',
          arguments: { projectName: TEST_PROJECT_NAME },
        } } as any,
        {} as any
      );

      const appState = JSON.parse(response.content[0].text);
      if (appState) {
        expect(appState).toHaveProperty('variables');
        expect(appState).toHaveProperty('dataTypes');
        console.log(`App state via MCP:
          - Variables: ${appState.variables?.length || 0}
          - Data Types: ${appState.dataTypes?.length || 0}
          - Constants: ${appState.constants?.length || 0}`);
      } else {
        console.log('No app state found in project');
      }
    }, 20000);
  });

  describe('Error Handling via MCP', () => {
    it('should handle project not found via MCP', async () => {
      const response: any = await client.request(
        { method: 'tools/call', params: {
          name: 'get_project_by_name',
          arguments: { projectName: 'NonExistentProject123' },
        } } as any,
        {} as any
      );

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('not found');
    }, 10000);

    it('should handle invalid tool call via MCP', async () => {
      await expect(client.request(
        { method: 'tools/call', params: {
          name: 'non_existent_tool',
          arguments: {},
        } } as any,
        {} as any
      )).rejects.toThrow();
    }, 10000);
  });
});

// Skip message for when MCP integration tests are disabled
if (SKIP_MCP_TESTS) {
  describe('MCP Integration Tests (Skipped)', () => {
    it('should run MCP integration tests when REAL_API=true', () => {
      console.log(`
🔌 To run MCP integration tests:
1. Ensure you have a test project: '${TEST_PROJECT_NAME}'
2. Build the server: npm run build
3. Run: REAL_API=true FLUTTERFLOW_API_TOKEN=your_token npm test tests/mcp-integration

🧪 These tests verify the full MCP protocol stack!
`);
    });
  });
}