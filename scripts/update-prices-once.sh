#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_FILE="$ROOT_DIR/public/prices.json"
. "$ROOT_DIR/scripts/fetch-prices.sh" >/dev/null 2>&1 || true
# Re-declare minimal fallbacks if sourcing failed
if ! command -v get_stooq_vals >/dev/null; then
  get_stooq_vals() {
    local csv line open close
    csv="$(curl -s "https://stooq.com/q/l/?s=$1&f=sd2t2ohlcv&h=e" || true)"
    line="$(printf "%s\n" "$csv" | sed -n '2p')"
    open="$(printf "%s" "$line" | awk -F',' '{print $4}')"
    close="$(printf "%s" "$line" | awk -F',' '{print $7}')"
    [[ "$open" == "N/D" || -z "$open" ]] && open="null"
    [[ "$close" == "N/D" || -z "$close" ]] && close="null"
    printf "%s,%s" "$open" "$close"
  }
  get_binance_price() { curl -s "https://api.binance.com/api/v3/ticker/price?symbol=$1" | sed -n 's/.*\"price\":\"\\([^\"]*\\)\".*/\\1/p'; }
  get_binance_change() { curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=$1" | sed -n 's/.*\"priceChangePercent\":\"\\([^\"]*\\)\".*/\\1/p'; }
  get_fx_rate() { curl -s "https://open.er-api.com/v6/latest/$1" | awk -F\"$2\\\": '{print $2}' | awk -F',' '{print $1}' | tr -d ' }\"'; }
fi
SPY_OPEN="$(get_stooq_vals spy.us | cut -d',' -f1)"; [[ -z "$SPY_OPEN" ]] && SPY_OPEN=null
SPY="$(get_stooq_vals spy.us | cut -d',' -f2)"; [[ -z "$SPY" ]] && SPY=null
QQQ_OPEN="$(get_stooq_vals qqq.us | cut -d',' -f1)"; [[ -z "$QQQ_OPEN" ]] && QQQ_OPEN=null
QQQ="$(get_stooq_vals qqq.us | cut -d',' -f2)"; [[ -z "$QQQ" ]] && QQQ=null
DIA_OPEN="$(get_stooq_vals dia.us | cut -d',' -f1)"; [[ -z "$DIA_OPEN" ]] && DIA_OPEN=null
DIA="$(get_stooq_vals dia.us | cut -d',' -f2)"; [[ -z "$DIA" ]] && DIA=null
EWJ_OPEN="$(get_stooq_vals ewj.us | cut -d',' -f1)"; [[ -z "$EWJ_OPEN" ]] && EWJ_OPEN=null
EWJ="$(get_stooq_vals ewj.us | cut -d',' -f2)"; [[ -z "$EWJ" ]] && EWJ=null
VIXY_OPEN="$(get_stooq_vals vixy.us | cut -d',' -f1)"; [[ -z "$VIXY_OPEN" ]] && VIXY_OPEN=null
VIXY="$(get_stooq_vals vixy.us | cut -d',' -f2)"; [[ -z "$VIXY" ]] && VIXY=null
GLD_OPEN="$(get_stooq_vals gld.us | cut -d',' -f1)"; [[ -z "$GLD_OPEN" ]] && GLD_OPEN=null
GLD="$(get_stooq_vals gld.us | cut -d',' -f2)"; [[ -z "$GLD" ]] && GLD=null
USO_OPEN="$(get_stooq_vals uso.us | cut -d',' -f1)"; [[ -z "$USO_OPEN" ]] && USO_OPEN=null
USO="$(get_stooq_vals uso.us | cut -d',' -f2)"; [[ -z "$USO" ]] && USO=null
BTCUSDT="$(get_binance_price BTCUSDT)"; [[ -z "$BTCUSDT" ]] && BTCUSDT=null
BTCUSDT_CHANGE="$(get_binance_change BTCUSDT)"; [[ -z "$BTCUSDT_CHANGE" ]] && BTCUSDT_CHANGE=null
USDJPY="$(get_fx_rate USD JPY)"; [[ -z "$USDJPY" ]] && USDJPY=null
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
