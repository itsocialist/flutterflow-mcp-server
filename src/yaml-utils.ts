import * as yaml from 'js-yaml';
import AdmZip from 'adm-zip';
import { z } from 'zod';

export interface ProjectYamlFiles {
  [filename: string]: any;
}

export class YamlUtils {
  static decodeProjectYaml(base64Content: string): ProjectYamlFiles {
    try {
      const zipBuffer = Buffer.from(base64Content, 'base64');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      const files: ProjectYamlFiles = {};

      entries.forEach((entry: any) => {
        if (!entry.isDirectory && entry.entryName.endsWith('.yaml')) {
          const content = entry.getData().toString('utf8');
          const parsed = yaml.load(content);
          files[entry.entryName] = parsed;
        }
      });

      return files;
    } catch (error) {
      throw new Error(`Failed to decode project YAML: ${error}`);
    }
  }

  static encodeProjectYaml(files: ProjectYamlFiles): string {
    try {
      const zip = new AdmZip();

      Object.entries(files).forEach(([filename, content]) => {
        const yamlContent = yaml.dump(content, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
        });
        zip.addFile(filename, Buffer.from(yamlContent, 'utf8'));
      });

      return zip.toBuffer().toString('base64');
    } catch (error) {
      throw new Error(`Failed to encode project YAML: ${error}`);
    }
  }

  static extractComponents(files: ProjectYamlFiles): any[] {
    const components: any[] = [];
    
    Object.entries(files).forEach(([filename, content]) => {
      if (filename.includes('components/') && content?.componentDefinition) {
        components.push({
          filename,
          name: content.componentDefinition.name || this.extractNameFromFilename(filename),
          definition: content.componentDefinition,
          properties: content.componentDefinition.properties || {},
          widgets: content.componentDefinition.widgets || [],
        });
      }
    });

    return components;
  }

  static extractPages(files: ProjectYamlFiles): any[] {
    const pages: any[] = [];
    
    Object.entries(files).forEach(([filename, content]) => {
      if (filename.includes('pages/') && content?.pageDefinition) {
        pages.push({
          filename,
          name: content.pageDefinition.name || this.extractNameFromFilename(filename),
          route: content.pageDefinition.route,
          definition: content.pageDefinition,
          widgets: content.pageDefinition.widgets || [],
          actions: content.pageDefinition.actions || [],
        });
      }
    });

    return pages;
  }

  static extractCustomCode(files: ProjectYamlFiles): {
    actions: any[];
    functions: any[];
    widgets: any[];
  } {
    const customCode = {
      actions: [] as any[],
      functions: [] as any[],
      widgets: [] as any[],
    };

    Object.entries(files).forEach(([filename, content]) => {
      if (filename.includes('custom_code/')) {
        if (filename.includes('actions/') && content?.actionDefinition) {
          customCode.actions.push({
            filename,
            name: content.actionDefinition.name,
            definition: content.actionDefinition,
            code: content.actionDefinition.code || '',
            parameters: content.actionDefinition.parameters || [],
          });
        } else if (filename.includes('functions/') && content?.functionDefinition) {
          customCode.functions.push({
            filename,
            name: content.functionDefinition.name,
            definition: content.functionDefinition,
            code: content.functionDefinition.code || '',
            parameters: content.functionDefinition.parameters || [],
          });
        } else if (filename.includes('widgets/') && content?.widgetDefinition) {
          customCode.widgets.push({
            filename,
            name: content.widgetDefinition.name,
            definition: content.widgetDefinition,
            code: content.widgetDefinition.code || '',
            properties: content.widgetDefinition.properties || [],
          });
        }
      }
    });

    return customCode;
  }

  static extractDatabaseCollections(files: ProjectYamlFiles): any[] {
    const collections: any[] = [];
    
    Object.entries(files).forEach(([filename, content]) => {
      if (filename.includes('collections/') && content?.collectionDefinition) {
        collections.push({
          filename,
          name: content.collectionDefinition.name || this.extractNameFromFilename(filename),
          definition: content.collectionDefinition,
          fields: content.collectionDefinition.fields || [],
          indexes: content.collectionDefinition.indexes || [],
        });
      } else if (content?.collections) {
        // Handle case where collections are defined in a single file
        Object.entries(content.collections).forEach(([collectionName, collectionData]: [string, any]) => {
          collections.push({
            filename,
            name: collectionName,
            definition: collectionData,
            fields: collectionData.fields || [],
            indexes: collectionData.indexes || [],
          });
        });
      }
    });

    return collections;
  }

  static extractAppState(files: ProjectYamlFiles): any {
    const appStateFile = files['app-state.yaml'] || files['appState.yaml'];
    return appStateFile ? {
      variables: appStateFile.variables || [],
      dataTypes: appStateFile.dataTypes || [],
      constants: appStateFile.constants || [],
    } : null;
  }

  static updateComponent(files: ProjectYamlFiles, componentName: string, updates: any): ProjectYamlFiles {
    const updatedFiles = { ...files };
    
    Object.entries(updatedFiles).forEach(([filename, content]) => {
      if (filename.includes('components/') && 
          (content?.componentDefinition?.name === componentName ||
           this.extractNameFromFilename(filename) === componentName)) {
        updatedFiles[filename] = {
          ...content,
          componentDefinition: {
            ...content.componentDefinition,
            ...updates,
          },
        };
      }
    });

    return updatedFiles;
  }

  static updatePage(files: ProjectYamlFiles, pageName: string, updates: any): ProjectYamlFiles {
    const updatedFiles = { ...files };
    
    Object.entries(updatedFiles).forEach(([filename, content]) => {
      if (filename.includes('pages/') && 
          (content?.pageDefinition?.name === pageName ||
           this.extractNameFromFilename(filename) === pageName)) {
        updatedFiles[filename] = {
          ...content,
          pageDefinition: {
            ...content.pageDefinition,
            ...updates,
          },
        };
      }
    });

    return updatedFiles;
  }

  static addCustomAction(files: ProjectYamlFiles, actionName: string, actionDefinition: any): ProjectYamlFiles {
    const filename = `custom_code/actions/${actionName}.yaml`;
    return {
      ...files,
      [filename]: {
        actionDefinition: {
          name: actionName,
          ...actionDefinition,
        },
      },
    };
  }

  static addCustomFunction(files: ProjectYamlFiles, functionName: string, functionDefinition: any): ProjectYamlFiles {
    const filename = `custom_code/functions/${functionName}.yaml`;
    return {
      ...files,
      [filename]: {
        functionDefinition: {
          name: functionName,
          ...functionDefinition,
        },
      },
    };
  }

  static addDatabaseCollection(files: ProjectYamlFiles, collectionName: string, collectionDefinition: any): ProjectYamlFiles {
    const filename = `collections/${collectionName}.yaml`;
    return {
      ...files,
      [filename]: {
        collectionDefinition: {
          name: collectionName,
          ...collectionDefinition,
        },
      },
    };
  }

  private static extractNameFromFilename(filename: string): string {
    const parts = filename.split('/');
    const nameWithExt = parts[parts.length - 1];
    return nameWithExt.replace('.yaml', '').replace('.yml', '');
  }
}