#!/bin/sh
# Genere un certificat auto-signe au demarrage, si absent.
#
# Pourquoi : sur http:// une IP privee n'est pas un "contexte securise", donc
# navigator.share, navigator.clipboard et getUserMedia (camera, donc scan de QR)
# sont purement indisponibles. Seuls localhost et 127.0.0.1 y echappent.
#
# Le SAN est indispensable : les navigateurs ignorent le Common Name depuis
# longtemps, et pour une IP il faut une entree de type IP: et non DNS:.
set -e

CERT_DIR=/etc/nginx/certs
CRT="$CERT_DIR/server.crt"
KEY="$CERT_DIR/server.key"

# Liste d'IP/hostnames a couvrir. HTTPS_SAN_HOSTS accepte plusieurs valeurs
# separees par des espaces ou des virgules (ex: "192.168.1.81 ketal.local").
EXTRA="${HTTPS_SAN_HOSTS:-}"

if [ -f "$CRT" ] && [ -f "$KEY" ]; then
    echo "[cert] certificat deja present, conserve"
    exit 0
fi

mkdir -p "$CERT_DIR"

# Construction des SAN : on distingue les IP des noms d'hote, sinon le
# navigateur rejette le certificat.
SAN="DNS:localhost,IP:127.0.0.1"
for h in $(echo "$EXTRA" | tr ',' ' '); do
    [ -z "$h" ] && continue
    if echo "$h" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
        SAN="$SAN,IP:$h"
    else
        SAN="$SAN,DNS:$h"
    fi
done

echo "[cert] generation d'un certificat auto-signe (SAN: $SAN)"

openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$KEY" -out "$CRT" \
    -days 825 \
    -subj "/CN=ketal-dev" \
    -addext "subjectAltName=$SAN" \
    -addext "basicConstraints=CA:FALSE" \
    -addext "keyUsage=digitalSignature,keyEncipherment" \
    -addext "extendedKeyUsage=serverAuth" \
    2>/dev/null

chmod 600 "$KEY"
chmod 644 "$CRT"
echo "[cert] certificat genere"
