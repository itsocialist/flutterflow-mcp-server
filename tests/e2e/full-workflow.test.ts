import { FlutterFlowAPI } from '../../src/flutterflow-api';
import { YamlUtils } from '../../src/yaml-utils';
import { MockFlutterFlowServer } from '../mocks/mock-server';
import * as responses from '../mocks/flutterflow-responses';

describe('End-to-End FlutterFlow Workflows', () => {
  let api: FlutterFlowAPI;
  let mockServer: MockFlutterFlowServer;

  beforeEach(() => {
    api = new FlutterFlowAPI();
    mockServer = new MockFlutterFlowServer();
  });

  describe('Complete Project Analysis Workflow', () => {
    it('should analyze a complete FlutterFlow project', async () => {
      const projectName = 'TestApp';

      // Step 1: List and find project
      mockServer.mockListProjects();
      const projects = await api.listProjects();
      const project = projects.find(p => p.name === projectName);
      expect(project).toBeDefined();

      // Step 2: Get project files
      mockServer.mockGetProjectFiles(project!.projectId);
      const files = await api.getProjectFiles(project!.projectId);
      expect(files).toContain('app-state.yaml');
      expect(files).toContain('pages/home_page.yaml');

      // Step 3: Download and analyze project YAML
      const fullProjectYaml = {
        'app-state.yaml': responses.mockAppState,
        'pages/home_page.yaml': { pageDefinition: responses.mockPages[0].definition },
        'components/custom_button.yaml': { componentDefinition: responses.mockComponents[0].definition },
        'collections/users.yaml': { collectionDefinition: responses.mockDatabaseCollections[0].definition },
        'custom_code/actions/validate_email.yaml': { actionDefinition: responses.mockCustomCode.actions[0].definition },
      };
      const mockYamlContent = YamlUtils.encodeProjectYaml(fullProjectYaml);

      mockServer.mockDownloadProjectYAML(project!.projectId, mockYamlContent);
      const yamlContent = await api.downloadProjectYAML(project!.projectId);
      const decodedFiles = YamlUtils.decodeProjectYaml(yamlContent);

      // Step 4: Extract all project elements
      const appState = YamlUtils.extractAppState(decodedFiles);
      const pages = YamlUtils.extractPages(decodedFiles);
      const components = YamlUtils.extractComponents(decodedFiles);
      const collections = YamlUtils.extractDatabaseCollections(decodedFiles);
      const customCode = YamlUtils.extractCustomCode(decodedFiles);

      // Verify complete project structure
      expect(appState?.variables).toHaveLength(3);
      expect(pages).toHaveLength(1);
      expect(components).toHaveLength(1);
      expect(collections).toHaveLength(1);
      expect(customCode.actions).toHaveLength(1);

      // Step 5: Verify project integrity
      expect(pages[0].name).toBe('HomePage');
      expect(components[0].name).toBe('CustomButton');
      expect(collections[0].name).toBe('users');
      expect(customCode.actions[0].name).toBe('validateEmail');
    });
  });

  describe('Component Update Workflow', () => {
    it('should update a component with validation', async () => {
      const projectId = 'proj_123';
      const componentName = 'CustomButton';

      // Step 1: Download existing project
      const existingYaml = {
        'components/custom_button.yaml': {
          componentDefinition: {
            name: 'CustomButton',
            properties: {
              text: { type: 'string', default: 'Click me' },
              enabled: { type: 'bool', default: true },
            },
          },
        },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYaml);
      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      const originalYaml = await api.downloadProjectYAML(projectId);
      const originalFiles = YamlUtils.decodeProjectYaml(originalYaml);

      // Step 2: Make component updates
      const updates = {
        properties: {
          text: { type: 'string', default: 'Updated Button' },
          enabled: { type: 'bool', default: true },
          color: { type: 'color', default: '#007AFF' }, // New property
          onTap: { type: 'action' }, // New property
        },
      };

      const updatedFiles = YamlUtils.updateComponent(originalFiles, componentName, updates);
      const updatedYamlContent = YamlUtils.encodeProjectYaml(updatedFiles);

      // Step 3: Validate changes
      mockServer.mockValidateProjectYAML(projectId, updatedYamlContent, {
        valid: true,
        errors: [],
        warnings: ['New action property added - ensure it\'s connected'],
      });

      const validation = await api.validateProjectYAML(projectId, updatedYamlContent);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(1);

      // Step 4: Apply changes
      mockServer.mockUpdateProjectYAML(projectId, updatedYamlContent, {
        ...responses.mockUpdateResponse,
        message: 'Component CustomButton updated successfully',
      });

      const result = await api.updateProjectYAML(projectId, updatedYamlContent, 'Update CustomButton with new properties');
      expect(result.success).toBe(true);

      // Step 5: Verify the update was applied correctly
      const component = YamlUtils.extractComponents(updatedFiles)[0];
      expect(component.definition.properties.color).toBeDefined();
      expect(component.definition.properties.onTap).toBeDefined();
      expect(component.definition.properties.text.default).toBe('Updated Button');
    });
  });

  describe('Database Schema Evolution Workflow', () => {
    it('should add new collection and update existing ones', async () => {
      const projectId = 'proj_123';

      // Step 1: Start with existing collections
      const existingYaml = {
        'collections/users.yaml': {
          collectionDefinition: {
            name: 'users',
            fields: [
              { name: 'email', type: 'string', required: true },
              { name: 'name', type: 'string', required: true },
            ],
            indexes: [{ fields: ['email'], unique: true }],
          },
        },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYaml);
      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      const originalYaml = await api.downloadProjectYAML(projectId);
      let currentFiles = YamlUtils.decodeProjectYaml(originalYaml);

      // Step 2: Add new collection
      const newCollectionDefinition = {
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'authorId', type: 'string', required: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'tags', type: 'array', subtype: 'string' },
        ],
        indexes: [
          { fields: ['authorId'] },
          { fields: ['createdAt'] },
          { fields: ['tags'] },
        ],
      };

      currentFiles = YamlUtils.addDatabaseCollection(currentFiles, 'articles', newCollectionDefinition);

      // Step 3: Update existing collection (add new field)
      const usersCollection = currentFiles['collections/users.yaml'];
      usersCollection.collectionDefinition.fields.push({
        name: 'profilePicture',
        type: 'string',
        required: false,
      });
      usersCollection.collectionDefinition.fields.push({
        name: 'lastLoginAt',
        type: 'timestamp',
      });

      const updatedYamlContent = YamlUtils.encodeProjectYaml(currentFiles);

      // Step 4: Validate schema changes
      mockServer.mockValidateProjectYAML(projectId, updatedYamlContent, {
        valid: true,
        errors: [],
        warnings: [
          'New collection "articles" added',
          'New fields added to "users" collection - consider data migration',
        ],
      });

      const validation = await api.validateProjectYAML(projectId, updatedYamlContent);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(2);

      // Step 5: Apply database changes
      mockServer.mockUpdateProjectYAML(projectId, updatedYamlContent, {
        success: true,
        message: 'Database schema updated successfully',
        commitId: 'db_update_789',
      });

      const result = await api.updateProjectYAML(projectId, updatedYamlContent, 'Add articles collection and update users schema');
      expect(result.success).toBe(true);

      // Step 6: Verify the database changes
      const collections = YamlUtils.extractDatabaseCollections(currentFiles);
      expect(collections).toHaveLength(2);

      const usersCollection2 = collections.find(c => c.name === 'users');
      const articlesCollection = collections.find(c => c.name === 'articles');

      expect(usersCollection2?.definition.fields).toHaveLength(4); // Original 2 + 2 new
      expect(articlesCollection?.definition.fields).toHaveLength(5);
      expect(articlesCollection?.definition.indexes).toHaveLength(3);
    });
  });

  describe('Custom Code Integration Workflow', () => {
    it('should add multiple custom functions and actions', async () => {
      const projectId = 'proj_123';

      // Step 1: Start with minimal project
      const existingYaml = {
        'app-state.yaml': {
          variables: [
            { name: 'currentUser', type: 'User', persisted: true },
          ],
        },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYaml);
      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      const originalYaml = await api.downloadProjectYAML(projectId);
      let currentFiles = YamlUtils.decodeProjectYaml(originalYaml);

      // Step 2: Add utility function
      const dateUtilFunction = {
        code: `
String formatDate(DateTime date, {String format = 'yyyy-MM-dd'}) {
  return DateFormat(format).format(date);
}

DateTime parseDate(String dateString) {
  return DateTime.parse(dateString);
}
        `.trim(),
        parameters: [
          { name: 'date', type: 'DateTime', required: true },
          { name: 'format', type: 'String', required: false, default: 'yyyy-MM-dd' },
        ],
        returnType: 'String',
      };

      currentFiles = YamlUtils.addCustomFunction(currentFiles, 'dateUtils', dateUtilFunction);

      // Step 3: Add validation action
      const validationAction = {
        code: `
Future<Map<String, dynamic>> validateUserInput(Map<String, dynamic> userData) async {
  final errors = <String, String>{};
  
  if (userData['email'] == null || !RegExp(r'^[^@]+@[^@]+\\.[^@]+').hasMatch(userData['email'])) {
    errors['email'] = 'Invalid email format';
  }
  
  if (userData['name'] == null || userData['name'].toString().trim().isEmpty) {
    errors['name'] = 'Name is required';
  }
  
  if (userData['age'] != null && userData['age'] < 0) {
    errors['age'] = 'Age must be positive';
  }
  
  return {
    'isValid': errors.isEmpty,
    'errors': errors,
  };
}
        `.trim(),
        parameters: [
          { name: 'userData', type: 'Map<String, dynamic>', required: true },
        ],
        returnType: 'Future<Map<String, dynamic>>',
      };

      currentFiles = YamlUtils.addCustomAction(currentFiles, 'validateUserInput', validationAction);

      // Step 4: Add API integration action
      const apiAction = {
        code: `
Future<Map<String, dynamic>?> fetchUserProfile(String userId) async {
  try {
    final response = await http.get(
      Uri.parse('https://api.example.com/users/\$userId'),
      headers: {'Authorization': 'Bearer \${FFAppState().authToken}'},
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      print('Failed to fetch user profile: \${response.statusCode}');
      return null;
    }
  } catch (e) {
    print('Error fetching user profile: \$e');
    return null;
  }
}
        `.trim(),
        parameters: [
          { name: 'userId', type: 'String', required: true },
        ],
        returnType: 'Future<Map<String, dynamic>?>',
        dependencies: ['http', 'dart:convert'],
      };

      currentFiles = YamlUtils.addCustomAction(currentFiles, 'fetchUserProfile', apiAction);

      const updatedYamlContent = YamlUtils.encodeProjectYaml(currentFiles);

      // Step 5: Validate all custom code
      mockServer.mockValidateProjectYAML(projectId, updatedYamlContent, {
        valid: true,
        errors: [],
        warnings: [
          'New dependencies detected: http, dart:convert - ensure they are added to pubspec.yaml',
          'Custom actions use FFAppState() - ensure proper state management',
        ],
      });

      const validation = await api.validateProjectYAML(projectId, updatedYamlContent);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(2);

      // Step 6: Apply custom code changes
      mockServer.mockUpdateProjectYAML(projectId, updatedYamlContent, {
        success: true,
        message: 'Custom code integration completed successfully',
        commitId: 'custom_code_456',
      });

      const result = await api.updateProjectYAML(
        projectId,
        updatedYamlContent,
        'Add date utilities, user validation, and API integration'
      );
      expect(result.success).toBe(true);

      // Step 7: Verify all custom code was added
      const customCode = YamlUtils.extractCustomCode(currentFiles);
      expect(customCode.functions).toHaveLength(1);
      expect(customCode.actions).toHaveLength(2);

      expect(customCode.functions[0].name).toBe('dateUtils');
      expect(customCode.actions.find(a => a.name === 'validateUserInput')).toBeDefined();
      expect(customCode.actions.find(a => a.name === 'fetchUserProfile')).toBeDefined();
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle validation errors and recover gracefully', async () => {
      const projectId = 'proj_123';

      // Step 1: Download existing project
      const existingYaml = {
        'components/button.yaml': {
          componentDefinition: {
            name: 'Button',
            properties: { text: { type: 'string' } },
          },
        },
      };
      const existingYamlContent = YamlUtils.encodeProjectYaml(existingYaml);
      mockServer.mockDownloadProjectYAML(projectId, existingYamlContent);

      const originalYaml = await api.downloadProjectYAML(projectId);
      const originalFiles = YamlUtils.decodeProjectYaml(originalYaml);

      // Step 2: Make invalid update
      const invalidUpdates = {
        properties: {
          invalidProperty: { type: 'invalid_type' }, // Invalid type
        },
        widgets: [
          { type: 'NonExistentWidget' }, // Non-existent widget
        ],
      };

      const updatedFiles = YamlUtils.updateComponent(originalFiles, 'Button', invalidUpdates);
      const updatedYamlContent = YamlUtils.encodeProjectYaml(updatedFiles);

      // Step 3: Validation should catch errors
      mockServer.mockValidateProjectYAML(projectId, updatedYamlContent, {
        valid: false,
        errors: [
          'Invalid property type: invalid_type',
          'Widget type NonExistentWidget does not exist',
          'Component Button missing required properties',
        ],
        warnings: [],
      });

      const validation = await api.validateProjectYAML(projectId, updatedYamlContent);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(3);

      // Step 4: Fix the errors
      const fixedUpdates = {
        properties: {
          text: { type: 'string', default: 'Fixed Button' },
          color: { type: 'color', default: '#007AFF' },
        },
        widgets: [
          { type: 'Container', children: [{ type: 'Text' }] },
        ],
      };

      const fixedFiles = YamlUtils.updateComponent(originalFiles, 'Button', fixedUpdates);
      const fixedYamlContent = YamlUtils.encodeProjectYaml(fixedFiles);

      // Step 5: Validation should now pass
      mockServer.mockValidateProjectYAML(projectId, fixedYamlContent, {
        valid: true,
        errors: [],
        warnings: ['Component structure looks good'],
      });

      const fixedValidation = await api.validateProjectYAML(projectId, fixedYamlContent);
      expect(fixedValidation.valid).toBe(true);

      // Step 6: Apply the fixed changes
      mockServer.mockUpdateProjectYAML(projectId, fixedYamlContent, responses.mockUpdateResponse);

      const result = await api.updateProjectYAML(projectId, fixedYamlContent, 'Fix component validation errors');
      expect(result.success).toBe(true);

      // Step 7: Verify the fix was applied
      const finalComponent = YamlUtils.extractComponents(fixedFiles)[0];
      expect(finalComponent.definition.properties.color).toBeDefined();
      expect(finalComponent.definition.widgets).toHaveLength(1);
    });
  });
});