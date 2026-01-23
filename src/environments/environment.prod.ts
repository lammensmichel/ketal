export const environment = {
  production: true,
  defaultLanguage: 'fr',
  appwrite: {
    endpoint: (window as any)['env']?.appwriteEndpoint || 'https://api.fug.app/v1',
    projectId: (window as any)['env']?.appwriteProjectId || 'fug',
  },
};
