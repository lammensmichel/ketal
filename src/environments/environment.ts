// Default environment configuration
// Override by setting APPWRITE_ENDPOINT in window._env_ = { APPWRITE_ENDPOINT: '...' }
// or by replacing this file per environment

export const environment = {
  production: false,
  defaultLanguage: 'fr',
  appwrite: {
    // Use environment variable if set (via angular.json fileReplacements or window config)
    endpoint: (window as any)._env_?.APPWRITE_ENDPOINT || 'http://127.0.0.1/v1',
    projectId: 'fug',
    databaseId: 'fug',
  },
};
