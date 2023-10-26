export const environment = {
  production: true,
  socketIoUrl:
    (window as any)['env']?.socketIoUrl || 'http://79.137.35.181:3000',
  defaultLanguage: 'fr'
};
