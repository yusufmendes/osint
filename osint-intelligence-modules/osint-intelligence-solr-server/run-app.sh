#!/usr/bin/env bash
#
# Solr container giris noktasi:
#   1) SolrCredentialFetcher ile /tmp/solr-credentials dosyasini olustur
#   2) Bu dosyadan SOLR_USER / SOLR_PASS degerlerini shell ortamina yukle
#   3) Solr'i on planda baslat (solr-foreground)
#
# Hata durumunda hicbir asamada Solr baslatilmaz.

set -euo pipefail

JAR_PATH="${JAR_PATH:-/opt/osint/osint-intelligence-solr-server.jar}"
CRED_FILE="${CRED_FILE:-/tmp/solr-credentials}"

echo "[run-app] credentials uretiliyor: ${CRED_FILE}"
java -jar "${JAR_PATH}" "${CRED_FILE}"

if [[ ! -s "${CRED_FILE}" ]]; then
    echo "[run-app] HATA: ${CRED_FILE} olusturulamadi veya bos." >&2
    exit 1
fi

# Sadece SOLR_USER / SOLR_PASS satirlarini guvenli sekilde yukle.
while IFS='=' read -r key value; do
    case "${key}" in
        SOLR_USER|SOLR_PASS)
            export "${key}=${value}"
            ;;
    esac
done < "${CRED_FILE}"

if [[ -z "${SOLR_USER:-}" || -z "${SOLR_PASS:-}" ]]; then
    echo "[run-app] HATA: SOLR_USER / SOLR_PASS okunamadi." >&2
    exit 1
fi

echo "[run-app] Solr baslatiliyor (user=${SOLR_USER}, core=${SOLR_CORE_NAME:-intelligence})"
exec solr-foreground
