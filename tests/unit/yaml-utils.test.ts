import { YamlUtils } from '../../src/yaml-utils';
import * as responses from '../mocks/flutterflow-responses';

describe('YamlUtils', () => {
  describe('encodeProjectYaml and decodeProjectYaml', () => {
    it('should encode and decode YAML files correctly', () => {
      const testFiles = {
        'app-state.yaml': {
          variables: [
            { name: 'currentUser', type: 'User', persisted: true },
          ],
          dataTypes: [
            { name: 'User', fields: [{ name: 'id', type: 'string' }] },
          ],
        },
        'pages/home_page.yaml': {
          pageDefinition: {
            name: 'HomePage',
            route: '/home',
            widgets: [{ type: 'Text', properties: { text: 'Hello' } }],
          },
        },
      };

      const encoded = YamlUtils.encodeProjectYaml(testFiles);
      expect(encoded).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern

      const decoded = YamlUtils.decodeProjectYaml(encoded);
      expect(decoded['app-state.yaml']).toEqual(testFiles['app-state.yaml']);
      expect(decoded['pages/home_page.yaml']).toEqual(testFiles['pages/home_page.yaml']);
    });

    it('should handle empty files object', () => {
      const encoded = YamlUtils.encodeProjectYaml({});
      const decoded = YamlUtils.decodeProjectYaml(encoded);
      expect(decoded).toEqual({});
    });

    it('should throw error for invalid base64 content', () => {
      expect(() => YamlUtils.decodeProjectYaml('invalid-base64')).toThrow('Failed to decode project YAML');
    });
  });

  describe('extractComponents', () => {
    it('should extract components from YAML files', () => {
      const files = {
        'components/custom_button.yaml': {
          componentDefinition: {
            name: 'CustomButton',
            properties: { text: { type: 'string' } },
            widgets: [{ type: 'Container' }],
          },
        },
        'components/header_widget.yaml': {
          componentDefinition: {
            name: 'HeaderWidget',
            properties: { title: { type: 'string' } },
          },
        },
        'pages/home_page.yaml': {
          pageDefinition: { name: 'HomePage' }, // Should be ignored
        },
      };

      const components = YamlUtils.extractComponents(files);

      expect(components).toHaveLength(2);
      expect(components[0].name).toBe('CustomButton');
      expect(components[0].filename).toBe('components/custom_button.yaml');
      expect(components[1].name).toBe('HeaderWidget');
    });

    it('should handle files with no components', () => {
      const files = {
        'app-state.yaml': { variables: [] },
        'pages/home_page.yaml': { pageDefinition: { name: 'HomePage' } },
      };

      const components = YamlUtils.extractComponents(files);
      expect(components).toHaveLength(0);
    });
  });

  describe('extractPages', () => {
    it('should extract pages from YAML files', () => {
      const files = {
        'pages/home_page.yaml': {
          pageDefinition: {
            name: 'HomePage',
            route: '/home',
            widgets: [{ type: 'Text' }],
            actions: [{ name: 'onTap' }],
          },
        },
        'pages/profile_page.yaml': {
          pageDefinition: {
            name: 'ProfilePage',
            route: '/profile',
          },
        },
        'components/button.yaml': {
          componentDefinition: { name: 'Button' }, // Should be ignored
        },
      };

      const pages = YamlUtils.extractPages(files);

      expect(pages).toHaveLength(2);
      expect(pages[0].name).toBe('HomePage');
      expect(pages[0].route).toBe('/home');
      expect(pages[0].widgets).toHaveLength(1);
      expect(pages[1].name).toBe('ProfilePage');
    });
  });

  describe('extractCustomCode', () => {
    it('should extract custom code from YAML files', () => {
      const files = {
        'custom_code/actions/validate_email.yaml': {
          actionDefinition: {
            name: 'validateEmail',
            code: 'bool validateEmail(String email) { return true; }',
            parameters: [{ name: 'email', type: 'String' }],
          },
        },
        'custom_code/functions/format_date.yaml': {
          functionDefinition: {
            name: 'formatDate',
            code: 'String formatDate(DateTime date) { return ""; }',
            parameters: [{ name: 'date', type: 'DateTime' }],
          },
        },
        'custom_code/widgets/custom_widget.yaml': {
          widgetDefinition: {
            name: 'CustomWidget',
            code: 'class CustomWidget extends StatelessWidget { }',
            properties: [{ name: 'title', type: 'String' }],
          },
        },
      };

      const customCode = YamlUtils.extractCustomCode(files);

      expect(customCode.actions).toHaveLength(1);
      expect(customCode.actions[0].name).toBe('validateEmail');
      expect(customCode.actions[0].code).toContain('validateEmail');

      expect(customCode.functions).toHaveLength(1);
      expect(customCode.functions[0].name).toBe('formatDate');

      expect(customCode.widgets).toHaveLength(1);
      expect(customCode.widgets[0].name).toBe('CustomWidget');
    });

    it('should return empty arrays when no custom code exists', () => {
      const files = {
        'app-state.yaml': { variables: [] },
      };

      const customCode = YamlUtils.extractCustomCode(files);

      expect(customCode.actions).toHaveLength(0);
      expect(customCode.functions).toHaveLength(0);
      expect(customCode.widgets).toHaveLength(0);
    });
  });

  describe('extractDatabaseCollections', () => {
    it('should extract collections from individual files', () => {
      const files = {
        'collections/users.yaml': {
          collectionDefinition: {
            name: 'users',
            fields: [
              { name: 'email', type: 'string', required: true },
              { name: 'name', type: 'string' },
            ],
            indexes: [{ fields: ['email'], unique: true }],
          },
        },
        'collections/posts.yaml': {
          collectionDefinition: {
            name: 'posts',
            fields: [{ name: 'title', type: 'string' }],
          },
        },
      };

      const collections = YamlUtils.extractDatabaseCollections(files);

      expect(collections).toHaveLength(2);
      expect(collections[0].name).toBe('users');
      expect(collections[0].fields).toHaveLength(2);
      expect(collections[1].name).toBe('posts');
    });

    it('should extract collections from single collections file', () => {
      const files = {
        'collections.yaml': {
          collections: {
            users: {
              fields: [{ name: 'email', type: 'string' }],
            },
            posts: {
              fields: [{ name: 'title', type: 'string' }],
            },
          },
        },
      };

      const collections = YamlUtils.extractDatabaseCollections(files);

      expect(collections).toHaveLength(2);
      expect(collections[0].name).toBe('users');
      expect(collections[1].name).toBe('posts');
    });
  });

  describe('extractAppState', () => {
    it('should extract app state from app-state.yaml', () => {
      const files = {
        'app-state.yaml': {
          variables: [
            { name: 'currentUser', type: 'User', persisted: true },
            { name: 'theme', type: 'string', default: 'light' },
          ],
          dataTypes: [
            { name: 'User', fields: [{ name: 'id', type: 'string' }] },
          ],
          constants: [
            { name: 'API_URL', value: 'https://api.example.com' },
          ],
        },
      };

      const appState = YamlUtils.extractAppState(files);

      expect(appState).toBeDefined();
      expect(appState.variables).toHaveLength(2);
      expect(appState.dataTypes).toHaveLength(1);
      expect(appState.constants).toHaveLength(1);
    });

    it('should handle alternative appState.yaml filename', () => {
      const files = {
        'appState.yaml': {
          variables: [{ name: 'user', type: 'User' }],
        },
      };

      const appState = YamlUtils.extractAppState(files);

      expect(appState).toBeDefined();
      expect(appState.variables).toHaveLength(1);
    });

    it('should return null when no app state file exists', () => {
      const files = {
        'components/button.yaml': { componentDefinition: {} },
      };

      const appState = YamlUtils.extractAppState(files);

      expect(appState).toBeNull();
    });
  });

  describe('updateComponent', () => {
    it('should update component by name', () => {
      const files = {
        'components/button.yaml': {
          componentDefinition: {
            name: 'Button',
            properties: { text: { type: 'string' } },
          },
        },
      };

      const updates = {
        properties: {
          text: { type: 'string', default: 'Click me' },
          color: { type: 'color', default: '#FF0000' },
        },
      };

      const updatedFiles = YamlUtils.updateComponent(files, 'Button', updates);

      expect(updatedFiles['components/button.yaml'].componentDefinition.properties).toEqual(updates.properties);
    });

    it('should update component by filename', () => {
      const files = {
        'components/custom_button.yaml': {
          componentDefinition: {
            properties: { text: { type: 'string' } },
          },
        },
      };

      const updatedFiles = YamlUtils.updateComponent(files, 'custom_button', { newProp: 'value' });

      expect(updatedFiles['components/custom_button.yaml'].componentDefinition.newProp).toBe('value');
    });
  });

  describe('addCustomAction', () => {
    it('should add custom action to files', () => {
      const files = {
        'app-state.yaml': { variables: [] },
      };

      const actionDefinition = {
        code: 'Future<void> myAction() async { print("Hello"); }',
        parameters: [],
      };

      const updatedFiles = YamlUtils.addCustomAction(files, 'myAction', actionDefinition);

      expect(updatedFiles['custom_code/actions/myAction.yaml']).toBeDefined();
      expect(updatedFiles['custom_code/actions/myAction.yaml'].actionDefinition.name).toBe('myAction');
      expect(updatedFiles['custom_code/actions/myAction.yaml'].actionDefinition.code).toContain('myAction');
    });
  });

  describe('addDatabaseCollection', () => {
    it('should add database collection to files', () => {
      const files = {};

      const collectionDefinition = {
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
        ],
        indexes: [{ fields: ['email'], unique: true }],
      };

      const updatedFiles = YamlUtils.addDatabaseCollection(files, 'customers', collectionDefinition);

      expect(updatedFiles['collections/customers.yaml']).toBeDefined();
      expect(updatedFiles['collections/customers.yaml'].collectionDefinition.name).toBe('customers');
      expect(updatedFiles['collections/customers.yaml'].collectionDefinition.fields).toHaveLength(2);
    });
  });

  describe('extractNameFromFilename', () => {
    it('should extract name from various filename formats', () => {
      // Test via the public methods that use this private method
      const files = {
        'components/my_custom_button.yaml': {
          componentDefinition: { /* no name field */ },
        },
      };

      const components = YamlUtils.extractComponents(files);
      expect(components[0].name).toBe('my_custom_button');
    });
  });
});