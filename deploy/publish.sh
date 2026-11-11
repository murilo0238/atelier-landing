#!/usr/bin/env bash
# Publica o ATELIER em https://atelier.garrastudios.online
# A VPS já serve <slug>.garrastudios.online a partir de /var/www/demos/<slug> (Nginx "garra-demos",
# certificado wildcard). A troca é atômica: envia para uma pasta nova e renomeia.
#
# Uso (Git Bash): DEPLOY_HOST=usuario@IP_DA_VPS DEPLOY_KEY=~/.ssh/sua_chave bash deploy/publish.sh
set -euo pipefail

cd "$(dirname "$0")/.."

: "${DEPLOY_HOST:?Defina DEPLOY_HOST, por exemplo: DEPLOY_HOST=usuario@SEU_IP}"
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
if [ -n "${DEPLOY_KEY:-}" ]; then SSH_OPTS+=(-i "$DEPLOY_KEY"); fi

SLUG="atelier"
PACKAGE="$(mktemp -t atelier-XXXXXX).tar.gz"
trap 'rm -f "$PACKAGE"' EXIT
tar -czf "$PACKAGE" index.html favicon.svg assets

echo "→ Enviando para $DEPLOY_HOST"
scp "${SSH_OPTS[@]}" -q "$PACKAGE" "$DEPLOY_HOST:/tmp/$SLUG.tar.gz"
ssh "${SSH_OPTS[@]}" "$DEPLOY_HOST" bash -s -- "$SLUG" <<'REMOTE'
set -euo pipefail
slug="$1"; base="/var/www/demos"
rm -rf "$base/.$slug.new" && mkdir -p "$base/.$slug.new"
tar -xzf "/tmp/$slug.tar.gz" -C "$base/.$slug.new" && rm -f "/tmp/$slug.tar.gz"
chmod -R a+rX "$base/.$slug.new"
rm -rf "$base/.$slug.old"
[ -d "$base/$slug" ] && mv "$base/$slug" "$base/.$slug.old"
mv "$base/.$slug.new" "$base/$slug"
echo "✓ No ar: https://$slug.garrastudios.online (versão anterior em $base/.$slug.old)"
REMOTE
