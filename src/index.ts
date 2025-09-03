#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { FlutterFlowAPI } from './flutterflow-api.js';
import { YamlUtils } from './yaml-utils.js';

const server = new Server(
  {
    name: 'flutterflow-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const flutterflowAPI = new FlutterFlowAPI();

async function resolveProjectId(args: any): Promise<string> {
  if (args.projectId) {
    return args.projectId;
  } else if (args.projectName) {
    const projectId = await flutterflowAPI.getProjectIdByName(args.projectName);
    if (!projectId) {
      throw new Error(`Project not found: ${args.projectName}`);
    }
    return projectId;
  } else {
    throw new Error('Either projectId or projectName must be provided');
  }
}

const tools: Tool[] = [
  {
    name: 'list_projects',
    description: 'List all FlutterFlow projects in your account',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_project_files',
    description: 'Get list of YAML files in a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'download_project_yaml',
    description: 'Download YAML configuration files for a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        fileNames: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Optional array of specific file names to download. If not provided, downloads all files.',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_components',
    description: 'Extract and list all custom components from a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        projectName: {
          type: 'string',
          description: 'Alternative: The FlutterFlow project name (case-insensitive)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_project_by_name',
    description: 'Find a FlutterFlow project by its name and get project details',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'The FlutterFlow project name (case-insensitive)',
        },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'get_pages',
    description: 'Extract and list all pages from a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_custom_code',
    description: 'Extract all custom code (actions, functions, widgets) from a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_database_collections',
    description: 'Extract database collections and schemas from a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_app_state',
    description: 'Extract app state variables and data types from a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'update_component',
    description: 'Update a specific component in a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        componentName: {
          type: 'string',
          description: 'Name of the component to update',
        },
        updates: {
          type: 'object',
          description: 'Component updates to apply',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message',
        },
      },
      required: ['projectId', 'componentName', 'updates'],
    },
  },
  {
    name: 'update_page',
    description: 'Update a specific page in a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        pageName: {
          type: 'string',
          description: 'Name of the page to update',
        },
        updates: {
          type: 'object',
          description: 'Page updates to apply',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message',
        },
      },
      required: ['projectId', 'pageName', 'updates'],
    },
  },
  {
    name: 'add_custom_action',
    description: 'Add a new custom action to a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        actionName: {
          type: 'string',
          description: 'Name of the custom action',
        },
        actionDefinition: {
          type: 'object',
          description: 'Action definition including code and parameters',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message',
        },
      },
      required: ['projectId', 'actionName', 'actionDefinition'],
    },
  },
  {
    name: 'add_custom_function',
    description: 'Add a new custom function to a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        functionName: {
          type: 'string',
          description: 'Name of the custom function',
        },
        functionDefinition: {
          type: 'object',
          description: 'Function definition including code and parameters',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message',
        },
      },
      required: ['projectId', 'functionName', 'functionDefinition'],
    },
  },
  {
    name: 'add_database_collection',
    description: 'Add a new database collection to a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        collectionName: {
          type: 'string',
          description: 'Name of the database collection',
        },
        collectionDefinition: {
          type: 'object',
          description: 'Collection definition including fields and indexes',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message',
        },
      },
      required: ['projectId', 'collectionName', 'collectionDefinition'],
    },
  },
  {
    name: 'validate_project_yaml',
    description: 'Validate YAML configuration before updating a FlutterFlow project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        yamlContent: {
          type: 'string',
          description: 'Base64-encoded zip file containing YAML files to validate',
        },
      },
      required: ['projectId', 'yamlContent'],
    },
  },
  {
    name: 'update_project_yaml',
    description: 'Update a FlutterFlow project with new YAML configuration',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The FlutterFlow project ID',
        },
        yamlContent: {
          type: 'string',
          description: 'Base64-encoded zip file containing YAML files to update',
        },
        commitMessage: {
          type: 'string',
          description: 'Optional commit message for the update',
        },
      },
      required: ['projectId', 'yamlContent'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_projects':
        const projects = await flutterflowAPI.listProjects();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };

      case 'get_project_files':
        const { projectId } = args as { projectId: string };
        const files = await flutterflowAPI.getProjectFiles(projectId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };

      case 'download_project_yaml':
        const { projectId: downloadProjectId, fileNames } = args as {
          projectId: string;
          fileNames?: string[];
        };
        const yaml = await flutterflowAPI.downloadProjectYAML(downloadProjectId, fileNames);
        return {
          content: [
            {
              type: 'text',
              text: yaml,
            },
          ],
        };

      case 'get_project_by_name':
        const { projectName } = args as { projectName: string };
        const project = await flutterflowAPI.getProjectByName(projectName);
        if (!project) {
          throw new Error(`Project not found: ${projectName}`);
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2),
            },
          ],
        };

      case 'get_components':
        const componentsProjectId = await resolveProjectId(args);
        const componentsYaml = await flutterflowAPI.downloadProjectYAML(componentsProjectId);
        const componentsFiles = YamlUtils.decodeProjectYaml(componentsYaml);
        const components = YamlUtils.extractComponents(componentsFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(components, null, 2),
            },
          ],
        };

      case 'get_pages':
        const pagesProjectId = await resolveProjectId(args);
        const pagesYaml = await flutterflowAPI.downloadProjectYAML(pagesProjectId);
        const pagesFiles = YamlUtils.decodeProjectYaml(pagesYaml);
        const pages = YamlUtils.extractPages(pagesFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pages, null, 2),
            },
          ],
        };

      case 'get_custom_code':
        const { projectId: customCodeProjectId } = args as { projectId: string };
        const customCodeYaml = await flutterflowAPI.downloadProjectYAML(customCodeProjectId);
        const customCodeFiles = YamlUtils.decodeProjectYaml(customCodeYaml);
        const customCode = YamlUtils.extractCustomCode(customCodeFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(customCode, null, 2),
            },
          ],
        };

      case 'get_database_collections':
        const { projectId: dbProjectId } = args as { projectId: string };
        const dbYaml = await flutterflowAPI.downloadProjectYAML(dbProjectId);
        const dbFiles = YamlUtils.decodeProjectYaml(dbYaml);
        const collections = YamlUtils.extractDatabaseCollections(dbFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(collections, null, 2),
            },
          ],
        };

      case 'get_app_state':
        const { projectId: appStateProjectId } = args as { projectId: string };
        const appStateYaml = await flutterflowAPI.downloadProjectYAML(appStateProjectId);
        const appStateFiles = YamlUtils.decodeProjectYaml(appStateYaml);
        const appState = YamlUtils.extractAppState(appStateFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(appState, null, 2),
            },
          ],
        };

      case 'update_component':
        const { projectId: updateComponentProjectId, componentName, updates: componentUpdates, commitMessage: componentCommitMessage } = args as {
          projectId: string;
          componentName: string;
          updates: any;
          commitMessage?: string;
        };
        const componentYaml = await flutterflowAPI.downloadProjectYAML(updateComponentProjectId);
        const componentFiles = YamlUtils.decodeProjectYaml(componentYaml);
        const updatedComponentFiles = YamlUtils.updateComponent(componentFiles, componentName, componentUpdates);
        const updatedComponentYaml = YamlUtils.encodeProjectYaml(updatedComponentFiles);
        const componentResult = await flutterflowAPI.updateProjectYAML(updateComponentProjectId, updatedComponentYaml, componentCommitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(componentResult, null, 2),
            },
          ],
        };

      case 'update_page':
        const { projectId: updatePageProjectId, pageName, updates: pageUpdates, commitMessage: pageCommitMessage } = args as {
          projectId: string;
          pageName: string;
          updates: any;
          commitMessage?: string;
        };
        const pageYaml = await flutterflowAPI.downloadProjectYAML(updatePageProjectId);
        const pageFiles = YamlUtils.decodeProjectYaml(pageYaml);
        const updatedPageFiles = YamlUtils.updatePage(pageFiles, pageName, pageUpdates);
        const updatedPageYaml = YamlUtils.encodeProjectYaml(updatedPageFiles);
        const pageResult = await flutterflowAPI.updateProjectYAML(updatePageProjectId, updatedPageYaml, pageCommitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pageResult, null, 2),
            },
          ],
        };

      case 'add_custom_action':
        const { projectId: actionProjectId, actionName, actionDefinition, commitMessage: actionCommitMessage } = args as {
          projectId: string;
          actionName: string;
          actionDefinition: any;
          commitMessage?: string;
        };
        const actionYaml = await flutterflowAPI.downloadProjectYAML(actionProjectId);
        const actionFiles = YamlUtils.decodeProjectYaml(actionYaml);
        const updatedActionFiles = YamlUtils.addCustomAction(actionFiles, actionName, actionDefinition);
        const updatedActionYaml = YamlUtils.encodeProjectYaml(updatedActionFiles);
        const actionResult = await flutterflowAPI.updateProjectYAML(actionProjectId, updatedActionYaml, actionCommitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(actionResult, null, 2),
            },
          ],
        };

      case 'add_custom_function':
        const { projectId: functionProjectId, functionName, functionDefinition, commitMessage: functionCommitMessage } = args as {
          projectId: string;
          functionName: string;
          functionDefinition: any;
          commitMessage?: string;
        };
        const functionYaml = await flutterflowAPI.downloadProjectYAML(functionProjectId);
        const functionFiles = YamlUtils.decodeProjectYaml(functionYaml);
        const updatedFunctionFiles = YamlUtils.addCustomFunction(functionFiles, functionName, functionDefinition);
        const updatedFunctionYaml = YamlUtils.encodeProjectYaml(updatedFunctionFiles);
        const functionResult = await flutterflowAPI.updateProjectYAML(functionProjectId, updatedFunctionYaml, functionCommitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(functionResult, null, 2),
            },
          ],
        };

      case 'add_database_collection':
        const { projectId: collectionProjectId, collectionName, collectionDefinition, commitMessage: collectionCommitMessage } = args as {
          projectId: string;
          collectionName: string;
          collectionDefinition: any;
          commitMessage?: string;
        };
        const collectionYaml = await flutterflowAPI.downloadProjectYAML(collectionProjectId);
        const collectionFiles = YamlUtils.decodeProjectYaml(collectionYaml);
        const updatedCollectionFiles = YamlUtils.addDatabaseCollection(collectionFiles, collectionName, collectionDefinition);
        const updatedCollectionYaml = YamlUtils.encodeProjectYaml(updatedCollectionFiles);
        const collectionResult = await flutterflowAPI.updateProjectYAML(collectionProjectId, updatedCollectionYaml, collectionCommitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(collectionResult, null, 2),
            },
          ],
        };

      case 'validate_project_yaml':
        const { projectId: validateProjectId, yamlContent: validateYaml } = args as {
          projectId: string;
          yamlContent: string;
        };
        const validation = await flutterflowAPI.validateProjectYAML(validateProjectId, validateYaml);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(validation, null, 2),
            },
          ],
        };

      case 'update_project_yaml':
        const { projectId: updateProjectId, yamlContent: updateYaml, commitMessage } = args as {
          projectId: string;
          yamlContent: string;
          commitMessage?: string;
        };
        const result = await flutterflowAPI.updateProjectYAML(updateProjectId, updateYaml, commitMessage);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FlutterFlow MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});