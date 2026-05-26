#!/bin/bash
# Script pour démarrer Angular en mode développement
# Fonctionne dans Docker avec polling pour le hot reload

# Kill le serveur en cours
echo "🔍 Recherche d'un serveur Angular..."
pids=$(lsof -ti:4200)
if [ ! -z "$pids" ]; then
  echo "⏹  Stop du serveur existant (PID: $pids) ..."
  pkill -f "ng serve" || pkill -f "angular" || kill $pids 2>/dev/null
  sleep 2
fi

# Démarrer le serveur
# setsid : crée un nouveau session group → survit à la mort du parent shell
# (utile quand le script est lancé par un sub-agent opencode dont les bg processes
# sont killés à la fin du tour)
echo "▶  Démarrage de Angular (port 4200, polling 2s) ..."
setsid nohup npx ng serve --host 0.0.0.0 --port 4200 --disable-host-check --poll 2000 </dev/null > /tmp/ng-serve.log 2>&1 &
disown

# Attendre la compilation
echo "⏳ Attente de la compilation..."
sleep 15

# Vérifier le statut
if grep -q "Compiled successfully" /tmp/ng-serve.log 2>/dev/null; then
  echo "✅ Angular tourne sur http://localhost:4200"
  echo "   Logs live: watch -n 1 'tail -f /tmp/ng-serve.log' "
else
  echo "⚠️  Compilation en cours (regarde les logs : tail /tmp/ng-serve.log)"
fi
