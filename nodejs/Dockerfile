# Utilisez une image de base Node.js
FROM node:18

# Créez un répertoire de travail dans le conteneur
WORKDIR /app

# Copiez le fichier package.json et le fichier package-lock.json (s'ils existent) pour installer les dépendances
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez le reste de l'application
COPY . .

# Exposez un port si votre application écoute sur un port spécifique
EXPOSE 3000

# Commande pour démarrer l'application
CMD [ "node", "Node.js" ]
