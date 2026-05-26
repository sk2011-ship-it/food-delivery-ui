#!/bin/bash

DIR="$(dirname "$0")"
ENV_FILE="$DIR/.env"

# Load dev env vars
set -a
source "$ENV_FILE"
set +a

case "${1:-deploy}" in
  sync)
    echo "🔄 Syncing dev env vars to Vercel..."
    echo ""

    python3 << PYEOF
import json, ssl, urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

token = "$VERCEL_TOKEN"
project_id = "$VERCEL_PROJECT_ID"
team_id = "$VERCEL_ORG_ID"

env_vars = []
with open("$ENV_FILE") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        eq = line.index("=")
        key = line[:eq]
        value = line[eq+1:]
        if key.startswith("VERCEL_"):
            continue
        env_vars.append({
            "key": key,
            "value": value,
            "target": ["production", "preview", "development"],
            "type": "encrypted"
        })

print(f"Syncing {len(env_vars)} env vars to Vercel (dev)...")

url = f"https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}&upsert=true"
data = json.dumps(env_vars).encode()
req = urllib.request.Request(url, data=data, method="POST", headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
})

resp = urllib.request.urlopen(req, context=ctx)
result = json.loads(resp.read())
if "created" in result:
    print(f"✅ {len(result['created'])} env vars synced to Vercel (dev)!")
else:
    print(result)
PYEOF
    ;;

  deploy)
    echo "🚀 Deploying to Vercel Dev..."
    echo ""
    npx vercel deploy --prod --token "$VERCEL_TOKEN"
    echo ""
    echo "✅ Done! Live at: https://food-delivery-ui-zeta.vercel.app"
    ;;

  all)
    echo "🔄 Syncing env vars + deploying (dev)..."
    echo ""
    "$0" sync && "$0" deploy
    ;;

  *)
    echo "Usage: ./deploy-dev.sh [command]"
    echo ""
    echo "  deploy  - Deploy to Vercel dev (default)"
    echo "  sync    - Sync .env vars to Vercel dev"
    echo "  all     - Sync env vars + deploy"
    ;;
esac
