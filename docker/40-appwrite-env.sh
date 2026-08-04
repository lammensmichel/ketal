#!/bin/sh
# Génère env.js au démarrage du container.
# nginx:alpine exécute automatiquement /docker-entrypoint.d/*.sh avant de lancer nginx.
#
# Évite un bind mount : le daemon Docker tourne sur le Mac et ne voit pas les
# chemins du dev-container, donc monter un fichier depuis /workspaces échoue.
set -e

# Par défaut l'endpoint est same-origin : nginx proxifie /v1 vers Appwrite.
# Une seule image fonctionne donc pour le LAN comme pour Tailscale, sans
# aucune configuration — l'app s'adapte à l'URL par laquelle on l'ouvre.
# APPWRITE_ENDPOINT ne sert qu'à pointer un backend externe.
if [ -n "${APPWRITE_ENDPOINT:-}" ]; then
    ENDPOINT_JS="'${APPWRITE_ENDPOINT}'"
    ENDPOINT_LOG="${APPWRITE_ENDPOINT}"
else
    ENDPOINT_JS="window.location.origin + '/v1'"
    ENDPOINT_LOG="same-origin (<origine courante>/v1)"
fi

PROJECT_ID="${APPWRITE_PROJECT_ID:-fug}"

cat > /usr/share/nginx/html/env.js <<EOF
// Généré au démarrage du container — ne pas éditer à la main.
window.env = {
  appwriteEndpoint: ${ENDPOINT_JS},
  appwriteProjectId: '${PROJECT_ID}',
};
// environment.ts (dev) et environment.prod.ts lisent deux clés différentes :
// on renseigne les deux.
window._env_ = {
  APPWRITE_ENDPOINT: window.env.appwriteEndpoint,
};
EOF

echo "[env] endpoint Appwrite = ${ENDPOINT_LOG} (projet ${PROJECT_ID})"
