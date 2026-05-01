# syntax=docker/dockerfile:1.6
#
# Solr server imaji:
#   - Resmi solr:${SOLR_VERSION} baz
#   - Mevcut "solr" kullanicisi yoksa "isr" olusturulur ve data yetkileri verilir
#   - Proje conf'u + core.properties imajdaki SOLR_HOME (/var/solr/data) altina kopyalanir
#   - Entry point: run-app.sh -> SolrCredentialFetcher -> /tmp/solr-credentials -> Solr
#
# Build: docker build --build-arg SOLR_VERSION=9.10.1 -t osint/intelligence-solr:0.1.0 .
# (veya pom.xml -Pdeployment uzerinden mvn package)
ARG SOLR_VERSION=9.10.1
FROM solr:${SOLR_VERSION}

ARG SOLR_CORE_NAME=intelligence
ENV SOLR_CORE_NAME=${SOLR_CORE_NAME}
ENV CRED_FILE=/tmp/solr-credentials
ENV JAR_PATH=/opt/osint/osint-intelligence-solr-server.jar

USER root

# Resmi solr imajinda zaten "solr" kullanicisi var; yoksa isr aciliyor ve
# /var/solr (default SOLR_HOME) sahipligi devrediliyor.
RUN set -eux; \
    if id -u solr >/dev/null 2>&1; then \
        RUN_USER=solr; \
    else \
        useradd --system --create-home --shell /bin/bash isr; \
        RUN_USER=isr; \
    fi; \
    mkdir -p /var/solr/data /opt/osint; \
    chown -R "$RUN_USER":"$RUN_USER" /var/solr /opt/osint; \
    echo "$RUN_USER" > /opt/osint/.run-user

# JRE: resmi solr imaji JRE icerir; gelmemesi durumuna karsi defansif kontrol
RUN set -eux; \
    if ! command -v java >/dev/null 2>&1; then \
        apt-get update; \
        apt-get install -y --no-install-recommends openjdk-17-jre-headless; \
        rm -rf /var/lib/apt/lists/*; \
    fi

# Proje artefaktlari (build context: modul koku)
COPY target/osint-intelligence-solr-server.jar /opt/osint/osint-intelligence-solr-server.jar
COPY src/main/resources/conf/ /var/solr/data/${SOLR_CORE_NAME}/conf/
COPY src/main/resources/core.properties /var/solr/data/${SOLR_CORE_NAME}/core.properties
COPY run-app.sh /opt/osint/run-app.sh

RUN set -eux; \
    chmod +x /opt/osint/run-app.sh; \
    RUN_USER="$(cat /opt/osint/.run-user)"; \
    chown -R "$RUN_USER":"$RUN_USER" /opt/osint /var/solr/data/${SOLR_CORE_NAME}

# Resmi solr imajindaki kullanici "solr"; ozel imaj isr olusturduysa o.
USER solr

EXPOSE 8983

ENTRYPOINT ["/bin/bash", "/opt/osint/run-app.sh"]
