#!/bin/bash
# Deploy agentes3d en VPS Principal.
# Reemplaza Claw3D en agente.gambolsoft.com.
set -e
exec 2>&1

REPO_URL="https://github.com/zpwpe/agentes3d.git"
ROOT=/root/agentes3d

echo "=== 1. Clone / pull ==="
if [ -d "$ROOT/.git" ]; then
  cd "$ROOT" && git pull --rebase --autostash
else
  rm -rf "$ROOT"
  git clone "$REPO_URL" "$ROOT"
fi

echo "=== 2. Bridge venv + deps ==="
cd "$ROOT/bridge"
python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

echo "=== 3. Web npm install (ignore-scripts) ==="
cd "$ROOT/web"
npm install --ignore-scripts --silent

echo "=== 4. Web build (prod) ==="
npm run build

echo "=== 5. Systemd units ==="
cp "$ROOT/deploy/agentes3d-bridge.service" /etc/systemd/system/agentes3d-bridge.service
cp "$ROOT/deploy/agentes3d-web.service"    /etc/systemd/system/agentes3d-web.service
systemctl daemon-reload

echo "=== 6. Stop old Claw3D services ==="
systemctl stop claw3d-studio claw3d-hermes 2>/dev/null || true
systemctl disable claw3d-studio claw3d-hermes 2>/dev/null || true

echo "=== 7. Swap nginx to agentes3d backend ==="
cp "$ROOT/deploy/nginx-agente.conf" /etc/nginx/sites-enabled/agente.gambolsoft.com
nginx -t
systemctl reload nginx

echo "=== 8. Start agentes3d ==="
systemctl enable --now agentes3d-bridge
sleep 3
systemctl enable --now agentes3d-web
sleep 8

echo "=== 9. Status ==="
systemctl is-active agentes3d-bridge agentes3d-web
ss -tlnp | grep -E ":3100|:8700"

echo "=== 10. Smoke test ==="
curl -sS --max-time 10 http://127.0.0.1:8700/health
echo
curl -sS --max-time 20 -L -o /dev/null -w "URL=%{url_effective} HTTP=%{http_code} SIZE=%{size_download}\n" https://agente.gambolsoft.com/

echo DONE
