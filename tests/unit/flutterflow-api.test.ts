import { FlutterFlowAPI } from '../../src/flutterflow-api';
import { MockFlutterFlowServer } from '../mocks/mock-server';
import * as responses from '../mocks/flutterflow-responses';

describe('FlutterFlowAPI', () => {
  let api: FlutterFlowAPI;
  let mockServer: MockFlutterFlowServer;

  beforeEach(() => {
    api = new FlutterFlowAPI();
    mockServer = new MockFlutterFlowServer();
  });

  describe('constructor', () => {
    it('should throw error if API token is not provided', () => {
      delete process.env.FLUTTERFLOW_API_TOKEN;
      expect(() => new FlutterFlowAPI()).toThrow('FLUTTERFLOW_API_TOKEN environment variable is required');
    });

    it('should use custom base URL from environment', () => {
      process.env.FLUTTERFLOW_API_BASE_URL = 'https://custom.api.com/v2';
      const customApi = new FlutterFlowAPI();
      expect(customApi).toBeDefined();
    });
  });

  describe('listProjects', () => {
    it('should return list of projects', async () => {
      mockServer.mockListProjects();

      const projects = await api.listProjects();

      expect(projects).toEqual(responses.mockProjects.entries);
      expect(projects).toHaveLength(2);
      expect(projects[0].projectId).toBe('proj_123');
      expect(projects[0].name).toBe('TestApp');
    });

    it('should handle API errors', async () => {
      mockServer.mockError('/l/listProjects', 'GET', 500, 'Server Error');

      await expect(api.listProjects()).rejects.toThrow('Failed to list projects: 500: Server Error');
    });

    it('should handle authentication errors', async () => {
      mockServer.mockAuthenticationError();

      await expect(api.listProjects()).rejects.toThrow('Failed to list projects: 401: Unauthorized');
    });
  });

  describe('getProjectByName', () => {
    beforeEach(() => {
      mockServer.mockListProjects();
    });

    it('should find project by exact name', async () => {
      const project = await api.getProjectByName('TestApp');

      expect(project).toBeDefined();
      expect(project?.projectId).toBe('proj_123');
      expect(project?.name).toBe('TestApp');
    });

    it('should find project by case-insensitive name', async () => {
      const project = await api.getProjectByName('testapp');

      expect(project).toBeDefined();
      expect(project?.projectId).toBe('proj_123');
      expect(project?.name).toBe('TestApp');
    });

    it('should return null if project not found', async () => {
      const project = await api.getProjectByName('NonExistentApp');

      expect(project).toBeNull();
    });
  });

  describe('getProjectIdByName', () => {
    beforeEach(() => {
      mockServer.mockListProjects();
    });

    it('should return project ID for existing project', async () => {
      const projectId = await api.getProjectIdByName('MyFlutterApp');

      expect(projectId).toBe('proj_456');
    });

    it('should return null for non-existent project', async () => {
      const projectId = await api.getProjectIdByName('NonExistentApp');

      expect(projectId).toBeNull();
    });
  });

  describe('getProjectFiles', () => {
    it('should return list of project files', async () => {
      const projectId = 'proj_123';
      mockServer.mockGetProjectFiles(projectId);

      const files = await api.getProjectFiles(projectId);

      expect(files).toEqual(responses.mockFileNames.fileNames);
      expect(files).toContain('app-state.yaml');
      expect(files).toContain('pages/home_page.yaml');
      expect(files).toContain('components/custom_button.yaml');
    });

    it('should handle project not found', async () => {
      const projectId = 'non_existent';
      mockServer.mockProjectNotFound(projectId);

      await expect(api.getProjectFiles(projectId)).rejects.toThrow('Failed to get project files: 404: Not Found');
    });
  });

  describe('downloadProjectYAML', () => {
    it('should download project YAML', async () => {
      const projectId = 'proj_123';
      mockServer.mockDownloadProjectYAML(projectId);

      const yaml = await api.downloadProjectYAML(projectId);

      expect(yaml).toBe(responses.mockYamlContent);
    });

    it('should download specific files when fileNames provided', async () => {
      const projectId = 'proj_123';
      const fileNames = ['app-state.yaml', 'pages/home_page.yaml'];
      mockServer.mockDownloadProjectYAML(projectId, responses.mockYamlContent, fileNames);

      const yaml = await api.downloadProjectYAML(projectId, fileNames);

      expect(yaml).toBe(responses.mockYamlContent);
    });

    it('should handle download errors', async () => {
      const projectId = 'proj_123';
      mockServer.mockError('/projectYamls', 'POST', 500, 'Download failed');

      await expect(api.downloadProjectYAML(projectId)).rejects.toThrow('Failed to download project YAML: 500: Download failed');
    });
  });

  describe('validateProjectYAML', () => {
    it('should validate YAML successfully', async () => {
      const projectId = 'proj_123';
      const yamlContent = responses.mockYamlContent;
      mockServer.mockValidateProjectYAML(projectId, yamlContent);

      const validation = await api.validateProjectYAML(projectId, yamlContent);

      expect(validation).toEqual(responses.mockValidationResponse);
      expect(validation.valid).toBe(true);
    });

    it('should return validation errors', async () => {
      const projectId = 'proj_123';
      const yamlContent = 'invalid-yaml';
      const errorResponse = {
        valid: false,
        errors: ['Invalid YAML format', 'Missing required field: name'],
        warnings: ['Deprecated property used'],
      };
      mockServer.mockValidateProjectYAML(projectId, yamlContent, errorResponse);

      const validation = await api.validateProjectYAML(projectId, yamlContent);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
      expect(validation.warnings).toHaveLength(1);
    });
  });

  describe('updateProjectYAML', () => {
    it('should update project successfully', async () => {
      const projectId = 'proj_123';
      const yamlContent = responses.mockYamlContent;
      mockServer.mockUpdateProjectYAML(projectId, yamlContent);

      const result = await api.updateProjectYAML(projectId, yamlContent);

      expect(result).toEqual(responses.mockUpdateResponse);
      expect(result.success).toBe(true);
    });

    it('should update project with commit message', async () => {
      const projectId = 'proj_123';
      const yamlContent = responses.mockYamlContent;
      const commitMessage = 'Update components';
      mockServer.mockUpdateProjectYAML(projectId, yamlContent, responses.mockUpdateResponse, commitMessage);

      const result = await api.updateProjectYAML(projectId, yamlContent, commitMessage);

      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      const projectId = 'proj_123';
      const yamlContent = responses.mockYamlContent;
      mockServer.mockError('/updateProjectByYaml', 'POST', 400, 'Invalid YAML');

      await expect(api.updateProjectYAML(projectId, yamlContent)).rejects.toThrow('Failed to update project YAML: 400: Invalid YAML');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      mockServer.scope.get('/l/listProjects').delay(31000).reply(200, responses.mockProjects);

      await expect(api.listProjects()).rejects.toThrow('timeout');
    }, 35000);

    it('should handle malformed responses', async () => {
      mockServer.scope.get('/l/listProjects').reply(200, 'not-json');

      await expect(api.listProjects()).rejects.toThrow();
    });
  });
});