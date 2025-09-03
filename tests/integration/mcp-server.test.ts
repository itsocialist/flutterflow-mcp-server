import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MockFlutterFlowServer } from '../mocks/mock-server';
import * as responses from '../mocks/flutterflow-responses';

// Import the MCP server components
import { FlutterFlowAPI } from '../../src/flutterflow-api';
import { YamlUtils } from '../../src/yaml-utils';

describe('MCP Server Integration Tests', () => {
  let mockServer: MockFlutterFlowServer;
  let api: FlutterFlowAPI;

  beforeEach(() => {
    mockServer = new MockFlutterFlowServer();
    api = new FlutterFlowAPI();
  });

  describe('list_projects tool', () => {
    it('should list projects successfully', async () => {
      mockServer.mockListProjects();

      const projects = await api.listProjects();

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('TestApp');
      expect(projects[1].name).toBe('MyFlutterApp');
    });
  });

  describe('get_project_by_name tool', () => {
    it('should find project by name', async () => {
      mockServer.mockListProjects();

      const project = await api.getProjectByName('TestApp');

      expect(project).toBeDefined();
      expect(project?.projectId).toBe('proj_123');
      expect(project?.name).toBe('TestApp');
    });

    it('should handle case-insensitive search', async () => {
      mockServer.mockListProjects();

      const project = await api.getProjectByName('myflutterapp');

      expect(project).toBeDefined();
      expect(project?.projectId).toBe('proj_456');
    });
  });

  describe('get_components tool', () => {
    it('should extract components from project YAML', async () => {
      const projectId = 'proj_123';
      
      // Mock the YAML content that contains components
      const yamlFiles = {
        'components/custom_button.yaml': {
          componentDefinition: responses.mockComponents[0].definition,
        },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, mockYamlContent);

      const yaml = await api.downloadProjectYAML(projectId);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const components = YamlUtils.extractComponents(files);

      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('CustomButton');
      expect(components[0].definition.properties.text).toBeDefined();
    });
  });

  describe('get_pages tool', () => {
    it('should extract pages from project YAML', async () => {
      const projectId = 'proj_123';
      
      const yamlFiles = {
        'pages/home_page.yaml': {
          pageDefinition: responses.mockPages[0].definition,
        },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, mockYamlContent);

      const yaml = await api.downloadProjectYAML(projectId);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const pages = YamlUtils.extractPages(files);

      expect(pages).toHaveLength(1);
      expect(pages[0].name).toBe('HomePage');
      expect(pages[0].route).toBe('/home');
    });
  });

  describe('get_custom_code tool', () => {
    it('should extract custom code from project YAML', async () => {
      const projectId = 'proj_123';
      
      const yamlFiles = {
        'custom_code/actions/validate_email.yaml': {
          actionDefinition: responses.mockCustomCode.actions[0].definition,
        },
        'custom_code/functions/format_date.yaml': {
          functionDefinition: responses.mockCustomCode.functions[0].definition,
        },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, mockYamlContent);

      const yaml = await api.downloadProjectYAML(projectId);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const customCode = YamlUtils.extractCustomCode(files);

      expect(customCode.actions).toHaveLength(1);
      expect(customCode.functions).toHaveLength(1);
      expect(customCode.actions[0].name).toBe('validateEmail');
      expect(customCode.functions[0].name).toBe('formatDate');
    });
  });

  describe('get_database_collections tool', () => {
    it('should extract database collections from project YAML', async () => {
      const projectId = 'proj_123';
      
      const yamlFiles = {
        'collections/users.yaml': {
          collectionDefinition: responses.mockDatabaseCollections[0].definition,
        },
        'collections/posts.yaml': {
          collectionDefinition: responses.mockDatabaseCollections[1].definition,
        },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, mockYamlContent);

      const yaml = await api.downloadProjectYAML(projectId);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const collections = YamlUtils.extractDatabaseCollections(files);

      expect(collections).toHaveLength(2);
      expect(collections[0].name).toBe('users');
      expect(collections[1].name).toBe('posts');
      expect(collections[0].definition.fields).toContain(
        expect.objectContaining({ name: 'email', type: 'string' })
      );
    });
  });

  describe('get_app_state tool', () => {
    it('should extract app state from project YAML', async () => {
      const projectId = 'proj_123';
      
      const yamlFiles = {
        'app-state.yaml': responses.mockAppState,
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, mockYamlContent);

      const yaml = await api.downloadProjectYAML(projectId);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const appState = YamlUtils.extractAppState(files);

      expect(appState).toBeDefined();
      expect(appState?.variables).toHaveLength(3);
      expect(appState?.dataTypes).toHaveLength(1);
      expect(appState?.constants).toHaveLength(1);
    });
  });

  describe('update_component tool', () => {
    it('should update component and push changes', async () => {
      const projectId = 'proj_123';
      const componentName = 'CustomButton';
      
      // Setup: Download existing YAML
      const existingYamlFiles = {
        'components/custom_button.yaml': {
          componentDefinition: {
            name: 'CustomButton',
            properties: { text: { type: 'string', default: 'Click me' } },
          },
        },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      // Setup: Mock the update
      const updates = {
        properties: {
          text: { type: 'string', default: 'Updated text' },
          color: { type: 'color', default: '#FF0000' },
        },
      };

      const updatedFiles = YamlUtils.updateComponent(existingYamlFiles, componentName, updates);
      const updatedYamlContent = YamlUtils.encodeProjectYaml(updatedFiles);

      mockServer.mockUpdateProjectYAML(projectId, updatedYamlContent, responses.mockUpdateResponse);

      // Execute: Download, update, and push
      const originalYaml = await api.downloadProjectYAML(projectId);
      const originalFiles = YamlUtils.decodeProjectYaml(originalYaml);
      const modifiedFiles = YamlUtils.updateComponent(originalFiles, componentName, updates);
      const modifiedYaml = YamlUtils.encodeProjectYaml(modifiedFiles);
      const result = await api.updateProjectYAML(projectId, modifiedYaml);

      expect(result.success).toBe(true);
      expect(modifiedFiles['components/custom_button.yaml'].componentDefinition.properties.color).toBeDefined();
    });
  });

  describe('add_custom_action tool', () => {
    it('should add custom action and push changes', async () => {
      const projectId = 'proj_123';
      
      // Setup: Start with minimal YAML
      const existingYamlFiles = {
        'app-state.yaml': { variables: [] },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYamlFiles);

      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      // Setup: Define the new action
      const actionName = 'validateInput';
      const actionDefinition = {
        code: 'Future<bool> validateInput(String input) async { return input.isNotEmpty; }',
        parameters: [{ name: 'input', type: 'String', required: true }],
        returnType: 'Future<bool>',
      };

      const updatedFiles = YamlUtils.addCustomAction(existingYamlFiles, actionName, actionDefinition);
      const updatedYamlContent = YamlUtils.encodeProjectYaml(updatedFiles);

      mockServer.mockUpdateProjectYAML(projectId, updatedYamlContent, responses.mockUpdateResponse);

      // Execute: Add action and push
      const originalYaml = await api.downloadProjectYAML(projectId);
      const originalFiles = YamlUtils.decodeProjectYaml(originalYaml);
      const modifiedFiles = YamlUtils.addCustomAction(originalFiles, actionName, actionDefinition);
      const modifiedYaml = YamlUtils.encodeProjectYaml(modifiedFiles);
      const result = await api.updateProjectYAML(projectId, modifiedYaml);

      expect(result.success).toBe(true);
      expect(modifiedFiles['custom_code/actions/validateInput.yaml']).toBeDefined();
      expect(modifiedFiles['custom_code/actions/validateInput.yaml'].actionDefinition.name).toBe(actionName);
    });
  });

  describe('validate_project_yaml tool', () => {
    it('should validate YAML before updates', async () => {
      const projectId = 'proj_123';
      const yamlContent = YamlUtils.encodeProjectYaml({
        'app-state.yaml': { variables: [] },
      });

      mockServer.mockValidateProjectYAML(projectId, yamlContent, {
        valid: true,
        errors: [],
        warnings: ['Consider adding more variables'],
      });

      const validation = await api.validateProjectYAML(projectId, yamlContent);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(1);
    });

    it('should return validation errors for invalid YAML', async () => {
      const projectId = 'proj_123';
      const invalidYamlContent = 'invalid-content';

      mockServer.mockValidateProjectYAML(projectId, invalidYamlContent, {
        valid: false,
        errors: ['Invalid YAML format', 'Missing required fields'],
        warnings: [],
      });

      const validation = await api.validateProjectYAML(projectId, invalidYamlContent);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle project not found errors', async () => {
      const nonExistentProjectId = 'proj_999';
      mockServer.mockProjectNotFound(nonExistentProjectId);

      await expect(api.getProjectFiles(nonExistentProjectId)).rejects.toThrow('404: Not Found');
    });

    it('should handle authentication errors', async () => {
      mockServer.mockAuthenticationError();

      await expect(api.listProjects()).rejects.toThrow('401: Unauthorized');
    });

    it('should handle rate limit errors', async () => {
      mockServer.mockRateLimitError();

      await expect(api.listProjects()).rejects.toThrow('429: Too Many Requests');
    });
  });

  describe('project name resolution', () => {
    it('should resolve project name to ID for components', async () => {
      const projectName = 'TestApp';
      
      // Mock list projects to enable name resolution
      mockServer.mockListProjects();
      
      // Mock download for the resolved project ID
      const yamlFiles = {
        'components/button.yaml': {
          componentDefinition: { name: 'Button', properties: {} },
        },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(yamlFiles);
      mockServer.mockDownloadProjectYAML('proj_123', mockYamlContent);

      // Test the resolution flow
      const projectId = await api.getProjectIdByName(projectName);
      expect(projectId).toBe('proj_123');
      
      const yaml = await api.downloadProjectYAML(projectId!);
      const files = YamlUtils.decodeProjectYaml(yaml);
      const components = YamlUtils.extractComponents(files);
      
      expect(components).toHaveLength(1);
      expect(components[0].name).toBe('Button');
    });
  });
});