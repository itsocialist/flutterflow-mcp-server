// Mock responses for FlutterFlow API

export const mockProjects = {
  entries: [
    {
      projectId: 'proj_123',
      name: 'TestApp',
      description: 'Test Flutter application',
      metadata: {
        owner: 'test@example.com',
        created: '2024-01-01T00:00:00Z',
      },
    },
    {
      projectId: 'proj_456',
      name: 'MyFlutterApp',
      description: 'Another test app',
      metadata: {
        owner: 'test@example.com',
        created: '2024-01-02T00:00:00Z',
      },
    },
  ],
};

export const mockFileNames = {
  fileNames: [
    'app-state.yaml',
    'pages/home_page.yaml',
    'pages/profile_page.yaml',
    'components/custom_button.yaml',
    'components/header_widget.yaml',
    'collections/users.yaml',
    'collections/posts.yaml',
    'custom_code/actions/validate_email.yaml',
    'custom_code/functions/format_date.yaml',
  ],
};

export const mockYamlContent = 'UEsDBBQAAAAIAGSgfFcAAAAAAAAAAAAYAAAAYXBwLXN0YXRlLnlhbWx2YXJpYWJsZXM6IFtdCmRhdGFUeXBlczogW10='; // Base64 encoded zip

export const mockValidationResponse = {
  valid: true,
  errors: [],
  warnings: [],
};

export const mockUpdateResponse = {
  success: true,
  message: 'Project updated successfully',
  commitId: 'commit_789',
};

export const mockComponents = [
  {
    filename: 'components/custom_button.yaml',
    name: 'CustomButton',
    definition: {
      name: 'CustomButton',
      properties: {
        text: { type: 'string', default: 'Click me' },
        color: { type: 'color', default: '#FF0000' },
        onTap: { type: 'action' },
      },
      widgets: [
        {
          type: 'Container',
          properties: { backgroundColor: 'color' },
          children: [
            { type: 'Text', properties: { text: 'text' } },
          ],
        },
      ],
    },
  },
];

export const mockPages = [
  {
    filename: 'pages/home_page.yaml',
    name: 'HomePage',
    route: '/home',
    definition: {
      name: 'HomePage',
      route: '/home',
      widgets: [
        {
          type: 'Scaffold',
          properties: { backgroundColor: '#FFFFFF' },
          children: [
            {
              type: 'AppBar',
              properties: { title: 'Home' },
            },
            {
              type: 'Column',
              children: [
                { type: 'Text', properties: { text: 'Welcome!' } },
                { type: 'CustomButton', properties: { text: 'Get Started' } },
              ],
            },
          ],
        },
      ],
      actions: [
        {
          name: 'onButtonTap',
          type: 'navigate',
          target: '/profile',
        },
      ],
    },
  },
];

export const mockCustomCode = {
  actions: [
    {
      filename: 'custom_code/actions/validate_email.yaml',
      name: 'validateEmail',
      definition: {
        name: 'validateEmail',
        code: 'bool validateEmail(String email) { return RegExp(r"^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").hasMatch(email); }',
        parameters: [
          { name: 'email', type: 'String', required: true },
        ],
        returnType: 'bool',
      },
    },
  ],
  functions: [
    {
      filename: 'custom_code/functions/format_date.yaml',
      name: 'formatDate',
      definition: {
        name: 'formatDate',
        code: 'String formatDate(DateTime date) { return DateFormat("yyyy-MM-dd").format(date); }',
        parameters: [
          { name: 'date', type: 'DateTime', required: true },
        ],
        returnType: 'String',
      },
    },
  ],
  widgets: [],
};

export const mockDatabaseCollections = [
  {
    filename: 'collections/users.yaml',
    name: 'users',
    definition: {
      name: 'users',
      fields: [
        { name: 'email', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'integer' },
        { name: 'createdAt', type: 'timestamp', required: true },
      ],
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['createdAt'] },
      ],
    },
  },
  {
    filename: 'collections/posts.yaml',
    name: 'posts',
    definition: {
      name: 'posts',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'authorId', type: 'string', required: true },
        { name: 'publishedAt', type: 'timestamp' },
      ],
      indexes: [
        { fields: ['authorId'] },
        { fields: ['publishedAt'] },
      ],
    },
  },
];

export const mockAppState = {
  variables: [
    { name: 'currentUser', type: 'User', persisted: true },
    { name: 'isLoggedIn', type: 'bool', default: false },
    { name: 'theme', type: 'string', default: 'light' },
  ],
  dataTypes: [
    {
      name: 'User',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
      ],
    },
  ],
  constants: [
    { name: 'API_BASE_URL', value: 'https://api.example.com' },
  ],
};