#!/usr/bin/env bash
# One-shot: sube el avatar de Arantxa Saiz Casas al bucket profile-assets
# y actualiza profiles.avatar_url. Se ejecuta como user auth efímero y limpia al final.
#
# Uso:  bash scripts/upload-arantxa-avatar.sh
# Requiere: .env.local con access token (sbp_...) VÁLIDO y VITE_SUPABASE_ANON_KEY.
#           Foto extraida del PDF del CV (scratchpad/arantxa-avatar.png).

set -e
cd "$(dirname "$0")/.."

ACCESS_TOKEN=$(awk -F'=' '/^access/ {gsub(/[[:space:]]/, "", $2); print $2}' .env.local)
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d= -f2 | tr -d '[:space:]')
IMG="/c/Users/nange/AppData/Local/Temp/claude/c--Proyectos-YourCVPassport/ac6f8d2a-c314-46de-83fa-d07ff2d617f7/scratchpad/arantxa-avatar.png"
BASE="https://djehzlzombqrzzuchcef.supabase.co"
MGMT="https://api.supabase.com/v1/projects/djehzlzombqrzzuchcef/database/query"
TARGET_UID="612f8c1c-4112-489a-b0dd-a913c28b1863"

[ -f "$IMG" ] || { echo "ERROR: no existe $IMG"; exit 1; }

# Chequeo temprano del token de gestión: falla claro en vez de a medio camino.
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ACCESS_TOKEN" https://api.supabase.com/v1/projects)
[ "$CODE" = "200" ] || { echo "ERROR: access token invalido o caducado (HTTP $CODE). Regenera en https://supabase.com/dashboard/account/tokens y actualiza .env.local"; exit 1; }

TMP_PWD=$(python -c "import secrets; print(secrets.token_urlsafe(24))")
TMP_UID=$(python -c "import uuid; print(uuid.uuid4())")
TMP_EMAIL="agent-tmp-$(python -c "import secrets; print(secrets.token_hex(6))")@iseie-agent.local"

# 1. Crear user auth efímero (INSERT directo, evitando SMTP)
SQL_INSERT=$(python -c "
import json, sys
q = f\"\"\"
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin, is_sso_user,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, phone_change,
  phone_change_token, reauthentication_token
) VALUES (
  '{sys.argv[1]}',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  '{sys.argv[2]}',
  crypt('{sys.argv[3]}', gen_salt('bf')),
  now(),
  '{{\"provider\":\"email\",\"providers\":[\"email\"]}}'::jsonb,
  '{{}}'::jsonb,
  now(), now(), false, false,
  '', '', '', '', '', '', '', ''
);
\"\"\"
print(json.dumps({'query': q}))
" "$TMP_UID" "$TMP_EMAIL" "$TMP_PWD")
INS=$(curl -s -X POST "$MGMT" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "$SQL_INSERT")
echo "1/5 insert_user: $(echo "$INS" | head -c 120)"

# 2. Login -> JWT
LOGIN=$(curl -s -X POST "$BASE/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "$(python -c "import json,sys; print(json.dumps({'email':sys.argv[1],'password':sys.argv[2]}))" "$TMP_EMAIL" "$TMP_PWD")")
JWT=$(echo "$LOGIN" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token',''))")
[ -z "$JWT" ] && { echo "FATAL login: $(echo "$LOGIN" | head -c 200)"; exit 1; }
echo "2/5 login: OK"

# 3. Upload al bucket profile-assets/avatars/
TS=$(python -c "import time; print(int(time.time()*1000))")
BUCKET_PATH="avatars/${TARGET_UID}-${TS}.png"
UP=$(curl -s -X POST "$BASE/storage/v1/object/profile-assets/$BUCKET_PATH" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT" \
  -H "Content-Type: image/png" --data-binary "@$IMG")
echo "3/5 upload: $(echo "$UP" | head -c 200)"

# 4. UPDATE avatar_url en profiles
FULL_URL="$BASE/storage/v1/object/public/profile-assets/$BUCKET_PATH"
curl -s -X POST "$MGMT" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "$(python -c "import json,sys; print(json.dumps({'query': f\"UPDATE profiles SET avatar_url='{sys.argv[1]}', updated_at=now() WHERE id='{sys.argv[2]}'\"}))" "$FULL_URL" "$TARGET_UID")" > /dev/null
echo "4/5 update_avatar: $FULL_URL"

# 5. Cleanup del user efímero
curl -s -X POST "$MGMT" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "$(python -c "import json,sys; print(json.dumps({'query': f\"DELETE FROM profiles WHERE id='{sys.argv[1]}'; DELETE FROM auth.users WHERE id='{sys.argv[1]}';\"}))" "$TMP_UID")" > /dev/null
echo "5/5 cleanup: OK"
echo ""
echo "==> Perfil: https://yourcvpassport.com/cv/arantxa-saiz"
