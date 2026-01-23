export const environment = {
  production: true,
  socketIoUrl: (window as any)['env']?.socketIoUrl || 'http://79.137.35.181:3000',
  defaultLanguage: 'fr',
  appwrite: {
    endpoint: (window as any)['env']?.appwriteEndpoint || 'https://api.fug.app/v1',
    projectId: (window as any)['env']?.appwriteProjectId || 'fug',
  },
};
