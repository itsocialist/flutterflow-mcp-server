import nock from 'nock';

// Global test setup
beforeEach(() => {
  // Clear all HTTP mocks before each test
  nock.cleanAll();
  
  // Set test environment variables
  process.env.FLUTTERFLOW_API_TOKEN = 'test-token-123';
  process.env.FLUTTERFLOW_API_BASE_URL = 'https://api.flutterflow.io/v2';
});

afterEach(() => {
  // Ensure all HTTP mocks were consumed
  if (!nock.isDone()) {
    console.warn('Not all HTTP mocks were consumed:', nock.pendingMocks());
    nock.cleanAll();
  }
});

afterAll(() => {
  // Clean up after all tests
  nock.restore();
});