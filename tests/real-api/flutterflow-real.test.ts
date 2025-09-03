/**
 * LEVEL 2: Real API End-to-End Tests
 * 
 * These tests hit the actual FlutterFlow API with real HTTP requests.
 * Run with: REAL_API=true FLUTTERFLOW_API_TOKEN=your_token npm run test:real-api
 * 
 * Requirements:
 * - Valid FlutterFlow API token
 * - Paid FlutterFlow subscription
 * - Test project that can be safely modified
 */

import { FlutterFlowAPI } from '../../src/flutterflow-api';
import { YamlUtils } from '../../src/yaml-utils';

const SKIP_REAL_API = !process.env.REAL_API || !process.env.FLUTTERFLOW_API_TOKEN;
const TEST_PROJECT_NAME = process.env.TEST_PROJECT_NAME || 'MCP-Test-Project';

describe.skipIf(SKIP_REAL_API)('Real FlutterFlow API Tests', () => {
  let api: FlutterFlowAPI;
  let testProjectId: string;

  beforeAll(async () => {
    if (SKIP_REAL_API) {
      console.log('Skipping real API tests. Set REAL_API=true and FLUTTERFLOW_API_TOKEN to run.');
      return;
    }

    api = new FlutterFlowAPI();
    
    // Find or create test project
    const projects = await api.listProjects();
    const testProject = projects.find(p => p.name === TEST_PROJECT_NAME);
    
    if (!testProject) {
      throw new Error(`Test project '${TEST_PROJECT_NAME}' not found. Please create it first.`);
    }
    
    testProjectId = testProject.projectId;
    console.log(`Using test project: ${TEST_PROJECT_NAME} (${testProjectId})`);
  }, 30000);

  describe('Project Management', () => {
    it('should list real projects', async () => {
      const projects = await api.listProjects();
      
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty('projectId');
      expect(projects[0]).toHaveProperty('name');
      
      console.log(`Found ${projects.length} projects`);
    }, 10000);

    it('should find project by name', async () => {
      const project = await api.getProjectByName(TEST_PROJECT_NAME);
      
      expect(project).toBeDefined();
      expect(project?.name).toBe(TEST_PROJECT_NAME);
      expect(project?.projectId).toBe(testProjectId);
    }, 10000);

    it('should get project files', async () => {
      const files = await api.getProjectFiles(testProjectId);
      
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      expect(files).toContain('app-state.yaml');
      
      console.log(`Project has ${files.length} files:`, files.slice(0, 5));
    }, 10000);
  });

  describe('YAML Operations', () => {
    let originalYaml: string;
    let originalFiles: any;

    beforeAll(async () => {
      originalYaml = await api.downloadProjectYAML(testProjectId);
      originalFiles = YamlUtils.decodeProjectYaml(originalYaml);
      console.log(`Downloaded project YAML (${originalYaml.length} chars)`);
    }, 15000);

    it('should download and decode project YAML', async () => {
      expect(typeof originalYaml).toBe('string');
      expect(originalYaml.length).toBeGreaterThan(0);
      expect(originalFiles).toBeDefined();
      expect(typeof originalFiles).toBe('object');
      
      const fileNames = Object.keys(originalFiles);
      expect(fileNames.length).toBeGreaterThan(0);
      console.log(`Decoded ${fileNames.length} YAML files`);
    });

    it('should validate project YAML', async () => {
      const validation = await api.validateProjectYAML(testProjectId, originalYaml);
      
      expect(validation).toHaveProperty('valid');
      expect(typeof validation.valid).toBe('boolean');
      
      if (!validation.valid) {
        console.log('Validation errors:', validation.errors);
        console.log('Validation warnings:', validation.warnings);
      }
      
      // Original project YAML should be valid
      expect(validation.valid).toBe(true);
    }, 15000);

    it('should extract project elements', async () => {
      const components = YamlUtils.extractComponents(originalFiles);
      const pages = YamlUtils.extractPages(originalFiles);
      const customCode = YamlUtils.extractCustomCode(originalFiles);
      const collections = YamlUtils.extractDatabaseCollections(originalFiles);
      const appState = YamlUtils.extractAppState(originalFiles);

      console.log(`Project analysis:
        - Components: ${components.length}
        - Pages: ${pages.length}  
        - Custom Actions: ${customCode.actions.length}
        - Custom Functions: ${customCode.functions.length}
        - Custom Widgets: ${customCode.widgets.length}
        - Database Collections: ${collections.length}
        - App State Variables: ${appState?.variables?.length || 0}
      `);

      // At minimum, should have app state
      expect(appState).toBeDefined();
    });
  });

  describe('Safe Modifications', () => {
    it('should add and remove a test app state variable', async () => {
      const originalYaml = await api.downloadProjectYAML(testProjectId);
      const originalFiles = YamlUtils.decodeProjectYaml(originalYaml);
      
      // Add test variable to app state
      const appStateFile = originalFiles['app-state.yaml'] || originalFiles['appState.yaml'];
      if (!appStateFile) {
        throw new Error('No app-state.yaml file found');
      }

      const testVariable = {
        name: 'mcpTestVariable',
        type: 'string',
        default: 'test-value',
        description: 'Test variable added by MCP tests',
      };

      // Backup original variables
      const originalVariables = [...(appStateFile.variables || [])];
      
      // Add test variable
      appStateFile.variables = [...originalVariables, testVariable];
      const modifiedYaml = YamlUtils.encodeProjectYaml(originalFiles);

      // Validate modification
      const validation = await api.validateProjectYAML(testProjectId, modifiedYaml);
      expect(validation.valid).toBe(true);

      // Apply modification
      const updateResult = await api.updateProjectYAML(
        testProjectId, 
        modifiedYaml, 
        'Add test variable via MCP integration test'
      );
      expect(updateResult).toHaveProperty('success');
      console.log('Added test variable:', updateResult);

      // Verify the change
      const updatedYaml = await api.downloadProjectYAML(testProjectId);
      const updatedFiles = YamlUtils.decodeProjectYaml(updatedYaml);
      const updatedAppState = YamlUtils.extractAppState(updatedFiles);
      
      const addedVariable = updatedAppState?.variables?.find(v => v.name === 'mcpTestVariable');
      expect(addedVariable).toBeDefined();
      expect(addedVariable?.type).toBe('string');

      // Clean up: Remove test variable
      appStateFile.variables = originalVariables;
      const cleanupYaml = YamlUtils.encodeProjectYaml(originalFiles);
      
      const cleanupResult = await api.updateProjectYAML(
        testProjectId,
        cleanupYaml,
        'Remove test variable via MCP integration test'
      );
      expect(cleanupResult).toHaveProperty('success');
      console.log('Cleaned up test variable:', cleanupResult);

    }, 45000); // Long timeout for API operations
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID', async () => {
      await expect(api.getProjectFiles('invalid-project-id')).rejects.toThrow();
    }, 10000);

    it('should handle invalid YAML validation', async () => {
      const invalidYaml = 'not-a-valid-base64-zip';
      await expect(api.validateProjectYAML(testProjectId, invalidYaml)).rejects.toThrow();
    }, 10000);
  });
});

// Skip message for when real API tests are disabled
if (SKIP_REAL_API) {
  describe('Real API Tests (Skipped)', () => {
    it('should run real API tests when REAL_API=true', () => {
      console.log(`
🚀 To run real API tests:
1. Create a test project in FlutterFlow named '${TEST_PROJECT_NAME}'
2. Get your API token from FlutterFlow Account Settings
3. Run: REAL_API=true FLUTTERFLOW_API_TOKEN=your_token npm test tests/real-api

⚠️  WARNING: These tests will modify your FlutterFlow project!
`);
    });
  });
}