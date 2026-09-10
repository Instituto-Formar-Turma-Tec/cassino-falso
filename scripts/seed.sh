#!/bin/bash
# Popula o banco Supabase (projeto upqsfmkxywegjbolqcqs) com dados de teste.
# Gera usuários + rounds + transactions COERENTES:
#   saldo_centavos        = saldo final calculado a partir do histórico
#   total_perdido_centavos = soma das perdas
#   rodadas_jogadas       = nº de rounds geradas
# Senha compartilhada: Teste@123
set -e

URL="https://upqsfmkxywegjbolqcqs.supabase.co"
# A secret key vem da variável de ambiente SUPABASE_SECRET_KEY (nunca commitada).
SECRET="${SUPABASE_SECRET_KEY:?Defina SUPABASE_SECRET_KEY no ambiente}"
H_AUTH="apikey: $SECRET"
H_BEARER="Authorization: Bearer $SECRET"
H_TYPE="Content-Type: application/json"

# Hash bcrypt REAL de "Teste@123"
HASH='$2b$10$35/OWIKfCnniHfsMMBjPaeN0t7EK9H8B88dvEs3uDiN4ht3R.Q5bW'

post() {
  local tbl="$1" body="$2"
  curl -s -X POST "$URL/rest/v1/$tbl" -H "$H_AUTH" -H "$H_BEARER" -H "$H_TYPE" -H "Prefer: return=minimal" -d "$body" >/dev/null
}

uuid() { python -c 'import uuid;print(uuid.uuid4())'; }

now=$(($(date +%s%3N)))
DAY=86400000
BET=1000

users=(
  "Ana Souza|20260001|8"
  "Bruno Lima|20260002|12"
  "Carla Mendes|20260003|10"
  "Diego Rocha|20260004|14"
  "Elisa Castro|20260005|11"
  "Felipe Nunes|20260006|9"
  "Gabriela Reis|20260007|13"
  "Henrique Pires|20260008|10"
  "Isabela Tavares|20260009|12"
  "João Vieira|20260010|9"
  "Larissa Melo|20260011|11"
  "Marcos Teixeira|20260012|10"
)

games=("slot|7" "bicho|Acertou: Águia" "tabuleiro|Dado 5" "roleta|Número 12" "blackjack|VOCÊ GANHOU!" "poker|Pair")

echo "--- Inserindo usuários + histórico ---"

for u in "${users[@]}"; do
  IFS='|' read -r nome matricula rodadas <<< "$u"
  uid=$(uuid)
  criado=$(( now - $((RANDOM % 40 + 5)) * DAY ))

  saldo=100000
  tot_perd=0
  tempo=$(( criado + 60000 ))

  # Primeiro: insere o usuário (FK rounds/transactions precisa dele)
  post users "{\"id\":\"$uid\",\"nome\":\"$nome\",\"matricula\":\"$matricula\",\"senha_hash\":\"$HASH\",\"saldo_centavos\":0,\"total_perdido_centavos\":0,\"rodadas_jogadas\":0,\"criado_em\":$criado,\"atualizado_em\":$criado}"

  for ((r=0; r<rodadas; r++)); do
    antes=$saldo
    rnd=$(( RANDOM % 100 ))
    if [ $rnd -lt 55 ]; then
      mult=0.0
      delta=-$BET
      desc="Perdeu a aposta"
      tipo="perda"
    else
      case $(( RANDOM % 5 )) in
        0) mult=0.5 ;;
        1) mult=1.0 ;;
        2) mult=1.35 ;;
        3) mult=2.2 ;;
        4) mult=3.0 ;;
      esac
      ganho=$(awk "BEGIN{print int($BET*$mult)}")
      delta=$(( -$BET + ganho ))
      desc="Ganhou (${mult}x)"
      tipo="resultado"
    fi
    depois=$(( antes + delta ))
    if [ $depois -lt 0 ]; then depois=0; delta=$(( antes - depois )); fi
    saldo=$depois
    if [ $delta -lt 0 ]; then tot_perd=$(( tot_perd - delta )); fi

    IFS='|' read -r jg res <<< "${games[$(( RANDOM % 6 ))]}"
    tempo=$(( tempo + RANDOM % 90000 + 30000 ))

    post rounds "{\"id\":\"$(uuid)\",\"user_id\":\"$uid\",\"tipo_jogo\":\"$jg\",\"aposta_centavos\":$BET,\"resultado\":\"$res\",\"multiplicador\":$mult,\"saldo_antes_centavos\":$antes,\"saldo_depois_centavos\":$depois,\"criado_em\":$tempo}"
    post transactions "{\"id\":\"$(uuid)\",\"user_id\":\"$uid\",\"tipo\":\"$tipo\",\"valor_centavos\":$delta,\"saldo_anterior_centavos\":$antes,\"saldo_novo_centavos\":$depois,\"descricao\":\"$desc\",\"criado_em\":$tempo}"
  done

  # Atualiza saldo_final/totais no usuário
  curl -s -X PATCH "$URL/rest/v1/users?id=eq.$uid" -H "$H_AUTH" -H "$H_BEARER" -H "$H_TYPE" -H "Prefer: return=minimal" \
    -d "{\"saldo_centavos\":$saldo,\"total_perdido_centavos\":$tot_perd,\"rodadas_jogadas\":$rodadas,\"atualizado_em\":$tempo}" >/dev/null
  echo "  ok: $nome ($matricula) saldo=$saldo perdido=$tot_perd rodadas=$rodadas"
done

echo "--- Seed completo ---"