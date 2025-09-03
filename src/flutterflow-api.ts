import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

const ProjectSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  metadata: z.any().optional(),
});

const ProjectsResponseSchema = z.object({
  entries: z.array(ProjectSchema),
});

const FileNamesResponseSchema = z.object({
  fileNames: z.array(z.string()),
});

const ValidationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
});

type Project = z.infer<typeof ProjectSchema>;
type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;
type FileNamesResponse = z.infer<typeof FileNamesResponseSchema>;
type ValidationResponse = z.infer<typeof ValidationResponseSchema>;

export class FlutterFlowAPI {
  private client: AxiosInstance;
  private baseURL: string;
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.FLUTTERFLOW_API_TOKEN || '';
    this.baseURL = process.env.FLUTTERFLOW_API_BASE_URL || 'https://api.flutterflow.io/v2';
    
    if (!this.apiToken) {
      throw new Error('FLUTTERFLOW_API_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async listProjects(): Promise<Project[]> {
    try {
      const response = await this.client.get('/l/listProjects');
      const parsed = ProjectsResponseSchema.parse(response.data);
      return parsed.entries;
    } catch (error) {
      throw new Error(`Failed to list projects: ${this.getErrorMessage(error)}`);
    }
  }

  async getProjectByName(projectName: string): Promise<Project | null> {
    try {
      const projects = await this.listProjects();
      return projects.find(project => 
        project.name.toLowerCase() === projectName.toLowerCase()
      ) || null;
    } catch (error) {
      throw new Error(`Failed to find project by name: ${this.getErrorMessage(error)}`);
    }
  }

  async getProjectIdByName(projectName: string): Promise<string | null> {
    try {
      const project = await this.getProjectByName(projectName);
      return project ? project.projectId : null;
    } catch (error) {
      throw new Error(`Failed to get project ID by name: ${this.getErrorMessage(error)}`);
    }
  }

  async getProjectFiles(projectId: string): Promise<string[]> {
    try {
      const response = await this.client.post('/listPartitionedFileNames', {
        projectId,
      });
      const parsed = FileNamesResponseSchema.parse(response.data);
      return parsed.fileNames;
    } catch (error) {
      throw new Error(`Failed to get project files: ${this.getErrorMessage(error)}`);
    }
  }

  async downloadProjectYAML(projectId: string, fileNames?: string[]): Promise<string> {
    try {
      const requestBody: any = { projectId };
      if (fileNames && fileNames.length > 0) {
        requestBody.fileNames = fileNames;
      }

      const response = await this.client.post('/projectYamls', requestBody);
      
      if (typeof response.data === 'string') {
        return response.data;
      } else if (response.data && typeof response.data.content === 'string') {
        return response.data.content;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      throw new Error(`Failed to download project YAML: ${this.getErrorMessage(error)}`);
    }
  }

  async validateProjectYAML(projectId: string, yamlContent: string): Promise<ValidationResponse> {
    try {
      const response = await this.client.post('/validateProjectYaml', {
        projectId,
        yamlContent,
      });
      return ValidationResponseSchema.parse(response.data);
    } catch (error) {
      throw new Error(`Failed to validate project YAML: ${this.getErrorMessage(error)}`);
    }
  }

  async updateProjectYAML(
    projectId: string, 
    yamlContent: string, 
    commitMessage?: string
  ): Promise<any> {
    try {
      const requestBody: any = {
        projectId,
        yamlContent,
      };
      
      if (commitMessage) {
        requestBody.commitMessage = commitMessage;
      }

      const response = await this.client.post('/updateProjectByYaml', requestBody);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update project YAML: ${this.getErrorMessage(error)}`);
    }
  }

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      if (error.response?.data?.error) {
        return error.response.data.error;
      }
      if (error.response?.statusText) {
        return `${error.response.status}: ${error.response.statusText}`;
      }
    }
    return error instanceof Error ? error.message : String(error);
  }
}