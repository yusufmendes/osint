#!/usr/bin/env bash
#
# Solr container entrypoint:
#   1) Run SolrCredentialFetcher to create /tmp/solr-credentials
#   2) Load SOLR_USER / SOLR_PASS from that file into the shell environment
#   3) Start Solr in the foreground (solr-foreground)
#
# On any error, Solr is not started.

set -euo pipefail

JAR_PATH="${JAR_PATH:-/opt/osint/osint-intelligence-solr-server.jar}"
CRED_FILE="${CRED_FILE:-/tmp/solr-credentials}"
# Docker: shaded jar is Java 21 bytecode; PATH java on the official Solr image is often 17.
# The Dockerfile copies Temurin 21 JRE under /opt/osint/jre-21. This script is only used
# as the container entrypoint; the default below is container-specific.
JAVA_CREDENTIALS="${JAVA_CREDENTIALS:-/opt/osint/jre-21/bin/java}"

if [[ ! -x "${JAVA_CREDENTIALS}" ]]; then
    echo "[run-app] ERROR: credential JVM not found: ${JAVA_CREDENTIALS}" >&2
    exit 1
fi

echo "[run-app] writing credentials: ${CRED_FILE} (java=${JAVA_CREDENTIALS})"
"${JAVA_CREDENTIALS}" -jar "${JAR_PATH}" "${CRED_FILE}"

if [[ ! -s "${CRED_FILE}" ]]; then
    echo "[run-app] ERROR: ${CRED_FILE} missing or empty." >&2
    exit 1
fi

# Load only SOLR_USER / SOLR_PASS lines safely.
while IFS='=' read -r key value; do
    case "${key}" in
        SOLR_USER|SOLR_PASS)
            export "${key}=${value}"
            ;;
    esac
done < "${CRED_FILE}"

if [[ -z "${SOLR_USER:-}" || -z "${SOLR_PASS:-}" ]]; then
    echo "[run-app] ERROR: SOLR_USER / SOLR_PASS could not be read." >&2
    exit 1
fi

echo "[run-app] starting Solr (user=${SOLR_USER}, core=${SOLR_CORE_NAME:-intelligence})"
exec solr-foreground
