import nock from 'nock';
import * as responses from './flutterflow-responses';

export class MockFlutterFlowServer {
  public scope: nock.Scope;
  
  constructor(baseUrl = 'https://api.flutterflow.io/v2') {
    this.scope = nock(baseUrl);
  }

  mockListProjects(projects = responses.mockProjects) {
    this.scope
      .get('/l/listProjects')
      .reply(200, projects);
    return this;
  }

  mockGetProjectFiles(projectId: string, fileNames = responses.mockFileNames) {
    this.scope
      .post('/listPartitionedFileNames', { projectId })
      .reply(200, fileNames);
    return this;
  }

  mockDownloadProjectYAML(projectId: string, yamlContent = responses.mockYamlContent, fileNames?: string[]) {
    const requestBody: any = { projectId };
    if (fileNames) {
      requestBody.fileNames = fileNames;
    }

    this.scope
      .post('/projectYamls', requestBody)
      .reply(200, yamlContent);
    return this;
  }

  mockValidateProjectYAML(projectId: string, yamlContent: string, validation: any = responses.mockValidationResponse) {
    this.scope
      .post('/validateProjectYaml', { projectId, yamlContent })
      .reply(200, validation);
    return this;
  }

  mockUpdateProjectYAML(projectId: string, yamlContent: string, result = responses.mockUpdateResponse, commitMessage?: string) {
    const requestBody: any = { projectId, yamlContent };
    if (commitMessage) {
      requestBody.commitMessage = commitMessage;
    }

    this.scope
      .post('/updateProjectByYaml', requestBody)
      .reply(200, result);
    return this;
  }

  mockError(endpoint: string, method: 'GET' | 'POST' = 'POST', statusCode = 500, errorMessage = 'Internal Server Error') {
    const mockMethod = method === 'GET' ? this.scope.get(endpoint) : this.scope.post(endpoint);
    mockMethod.reply(statusCode, { error: errorMessage, message: errorMessage });
    return this;
  }

  mockAuthenticationError() {
    this.scope
      .persist()
      .get('/l/listProjects')
      .reply(401, { error: 'Unauthorized', message: 'Invalid API token' });
    return this;
  }

  mockRateLimitError() {
    this.scope
      .get('/l/listProjects')
      .reply(429, { error: 'Too Many Requests', message: 'Rate limit exceeded' });
    return this;
  }

  mockProjectNotFound(projectId: string) {
    this.scope
      .post('/listPartitionedFileNames', { projectId })
      .reply(404, { error: 'Not Found', message: `Project ${projectId} not found` });
    return this;
  }

  isDone() {
    return this.scope.isDone();
  }

  done() {
    this.scope.done();
  }
}