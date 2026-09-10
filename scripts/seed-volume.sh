#!/bin/bash
# Seed de VOLUME: adiciona muitas rounds/transactions aos usuários de teste.
# Não recria usuários. Lê a chave de SUPABASE_SECRET_KEY (nunca commitada).
# Uso: SUPABASE_SECRET_KEY=... bash scripts/seed-volume.sh [ROUNDS_POR_USUARIO]
set -e

URL="https://upqsfmkxywegjbolqcqs.supabase.co"
SECRET="${SUPABASE_SECRET_KEY:?Defina SUPABASE_SECRET_KEY no ambiente}"
H_AUTH="apikey: $SECRET"
H_BEARER="Authorization: Bearer $SECRET"
H_TYPE="Content-Type: application/json"

ROUNDS="${1:-50}"
# Aguarda um pouco entre inserts p/ não estourar rate limit do PostgREST
GAP_MS=80

post() {
  curl -s -X POST "$URL/rest/v1/$1" -H "$H_AUTH" -H "$H_BEARER" -H "$H_TYPE" -H "Prefer: return=minimal" -d "$2" >/dev/null
}

uuid() { python -c 'import uuid;print(uuid.uuid4())'; }

# Pega usuários de teste existentes
echo "Buscando usuários de teste (2026%)..."
UIDS_JSON=$(curl -s -H "$H_AUTH" -H "$H_BEARER" "$URL/rest/v1/users?matricula=like.2026*&select=id")
UIDS=$(echo "$UIDS_JSON" | python -c "import sys,json;print(' '.join(r['id'] for r in json.load(sys.stdin)))")
read -ra UIDS <<< "$UIDS"
echo "Encontrados: ${#UIDS[@]} usuários. Gerando $ROUNDS rounds cada → $((${#UIDS[@]}*ROUNDS)) rounds."

now=$(($(date +%s%3N)))
games=("slot|7" "bicho|Acertou: Águia" "tabuleiro|Dado 5" "roleta|Número 12" "blackjack|VOCÊ GANHOU!" "poker|Pair")
BET=1000

for uid in "${UIDS[@]}"; do
  # saldo atual do usuário p/ continuar o histórico de forma coerente
  saldo=$(curl -s -H "$H_AUTH" -H "$H_BEARER" "$URL/rest/v1/users?id=eq.$uid&select=saldo_centavos" | python -c "import sys,json;print(json.load(sys.stdin)[0]['saldo_centavos'])")
  tempo=$now
  for ((r=0; r<ROUNDS; r++)); do
    antes=$saldo
    rnd=$(( RANDOM % 100 ))
    if [ $rnd -lt 55 ]; then
      mult=0.0; delta=-$BET; desc="Perdeu a aposta"; tipo="perda"
    else
      case $(( RANDOM % 5 )) in
        0) mult=0.5 ;; 1) mult=1.0 ;; 2) mult=1.35 ;; 3) mult=2.2 ;; 4) mult=3.0 ;;
      esac
      ganho=$(awk "BEGIN{print int($BET*$mult)}"); delta=$(( -$BET + ganho )); desc="Ganhou (${mult}x)"; tipo="resultado"
    fi
    depois=$(( antes + delta )); [ $depois -lt 0 ] && depois=0 && delta=$(( antes - depois )); saldo=$depois
    IFS='|' read -r jg res <<< "${games[$(( RANDOM % 6 ))]}"
    tempo=$(( tempo + RANDOM % 90000 + 30000 ))
    post rounds "{\"id\":\"$(uuid)\",\"user_id\":\"$uid\",\"tipo_jogo\":\"$jg\",\"aposta_centavos\":$BET,\"resultado\":\"$res\",\"multiplicador\":$mult,\"saldo_antes_centavos\":$antes,\"saldo_depois_centavos\":$depois,\"criado_em\":$tempo}"
    post transactions "{\"id\":\"$(uuid)\",\"user_id\":\"$uid\",\"tipo\":\"$tipo\",\"valor_centavos\":$delta,\"saldo_anterior_centavos\":$antes,\"saldo_novo_centavos\":$depois,\"descricao\":\"$desc\",\"criado_em\":$tempo}"
    sleep 0.08
  done
  curl -s -X PATCH "$URL/rest/v1/users?id=eq.$uid" -H "$H_AUTH" -H "$H_BEARER" -H "$H_TYPE" -H "Prefer: return=minimal" -d "{\"saldo_centavos\":$saldo}" >/dev/null
  echo "  $uid: +$ROUNDS rounds (saldo final $saldo)"
done
echo "--- Seed de volume completo (${#UIDS[@]} usuários x $ROUNDS) ---"