#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_FILE="$ROOT_DIR/public/prices.json"

function get_stooq_vals() {
  local code="$1"
  local csv
  csv="$(curl -s "https://stooq.com/q/l/?s=${code}&f=sd2t2ohlcv&h=e" || true)"
  local line
  line="$(printf "%s\n" "$csv" | sed -n '2p')"
  # Open is 4th, Close is 7th
  local open close
  open="$(printf "%s" "$line" | awk -F',' '{print $4}')"
  close="$(printf "%s" "$line" | awk -F',' '{print $7}')"
  [[ "$open" == "N/D" || -z "$open" ]] && open="null"
  [[ "$close" == "N/D" || -z "$close" ]] && close="null"
  printf "%s,%s" "$open" "$close"
}

function get_binance_price() {
  local symbol="$1"
  local json
  json="$(curl -s "https://api.binance.com/api/v3/ticker/price?symbol=${symbol}" || true)"
  local price
  price="$(printf "%s" "$json" | sed -n 's/.*\"price\":\"\\([^\"]*\\)\".*/\\1/p')"
  if [[ -z "$price" ]]; then
    printf "null"
  else
    printf "%s" "$price"
  fi
}

function get_binance_change() {
  local symbol="$1"
  local json
  json="$(curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}" || true)"
  local pct
  pct="$(printf "%s" "$json" | sed -n 's/.*\"priceChangePercent\":\"\\([^\"]*\\)\".*/\\1/p')"
  if [[ -z "$pct" ]]; then
    printf "null"
  else
    printf "%s" "$pct"
  fi
}

function get_fx_rate() {
  local base="$1"
  local sym="$2"
  local json
  json="$(curl -s "https://open.er-api.com/v6/latest/${base}" || true)"
  local rate
  rate="$(printf "%s" "$json" | awk -F"${sym}\":" '{print $2}' | awk -F',' '{print $1}' | tr -d ' }\"')"
  if [[ -z "$rate" ]]; then
    printf "null"
  else
    printf "%s" "$rate"
  fi
}

mkdir -p "$(dirname "$OUT_FILE")"

while true; do
  SPY_OPEN="$(get_stooq_vals spy.us | cut -d',' -f1)"
  SPY="$(get_stooq_vals spy.us | cut -d',' -f2)"
  QQQ_OPEN="$(get_stooq_vals qqq.us | cut -d',' -f1)"
  QQQ="$(get_stooq_vals qqq.us | cut -d',' -f2)"
  DIA_OPEN="$(get_stooq_vals dia.us | cut -d',' -f1)"
  DIA="$(get_stooq_vals dia.us | cut -d',' -f2)"
  EWJ_OPEN="$(get_stooq_vals ewj.us | cut -d',' -f1)"
  EWJ="$(get_stooq_vals ewj.us | cut -d',' -f2)"
  VIXY_OPEN="$(get_stooq_vals vixy.us | cut -d',' -f1)"
  VIXY="$(get_stooq_vals vixy.us | cut -d',' -f2)"
  GLD_OPEN="$(get_stooq_vals gld.us | cut -d',' -f1)"
  GLD="$(get_stooq_vals gld.us | cut -d',' -f2)"
  USO_OPEN="$(get_stooq_vals uso.us | cut -d',' -f1)"
  USO="$(get_stooq_vals uso.us | cut -d',' -f2)"
  BTCUSDT="$(get_binance_price BTCUSDT)"
  BTCUSDT_CHANGE="$(get_binance_change BTCUSDT)"
  USDJPY="$(get_fx_rate USD JPY)"

  cat > "$OUT_FILE" <<JSON
{
  "SPY": $SPY,
  "SPY_OPEN": $SPY_OPEN,
  "QQQ": $QQQ,
  "QQQ_OPEN": $QQQ_OPEN,
  "DIA": $DIA,
  "DIA_OPEN": $DIA_OPEN,
  "EWJ": $EWJ,
  "EWJ_OPEN": $EWJ_OPEN,
  "VIXY": $VIXY,
  "VIXY_OPEN": $VIXY_OPEN,
  "GLD": $GLD,
  "GLD_OPEN": $GLD_OPEN,
  "USO": $USO,
  "USO_OPEN": $USO_OPEN,
  "BTCUSDT": $BTCUSDT,
  "BTCUSDT_CHANGE": $BTCUSDT_CHANGE,
  "USDJPY": $USDJPY,
  "updated": $(date +%s)
}
JSON
  sleep 15
done
