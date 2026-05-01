# syntax=docker/dockerfile:1.6
#
# Solr server image:
#   - Official solr:${SOLR_VERSION} base (bundled JVM is often Java 17 — sufficient for Solr)
#   - Separate Java 21 JRE (Eclipse Temurin) copied to /opt/osint/jre-21; only the
#     SolrCredentialFetcher shaded jar runs on this JVM (class file 65 compatibility).
#   - If no "solr" user exists, create "isr" and grant data directory permissions
#   - Project conf + core.properties copied under image SOLR_HOME (/var/solr/data)
#   - Entry point: run-app.sh -> SolrCredentialFetcher -> /tmp/solr-credentials -> Solr
#
# Build: docker build --build-arg SOLR_VERSION=9.10.1 -t osint-intelligence-solr-server:0.1.0 .
# (or: mvn -Pdeployment package)
ARG SOLR_VERSION=9.10.1
# Shaded jar is built with Java 21; the Solr image PATH java may be 17, so the credential
# step uses Temurin 21 JRE (glibc-based image; compatible with the official Solr image).
ARG CREDENTIALS_JAVA_IMAGE=eclipse-temurin:21-jre
FROM ${CREDENTIALS_JAVA_IMAGE} AS credentials-jre

FROM solr:${SOLR_VERSION}

ARG SOLR_CORE_NAME=intelligence
ENV SOLR_CORE_NAME=${SOLR_CORE_NAME}
ENV CRED_FILE=/tmp/solr-credentials
ENV JAR_PATH=/opt/osint/osint-intelligence-solr-server.jar
ENV JAVA_CREDENTIALS=/opt/osint/jre-21/bin/java

USER root

COPY --from=credentials-jre /opt/java/openjdk /opt/osint/jre-21

# Official Solr image already has user "solr"; otherwise create "isr" and
# hand ownership of /var/solr (default SOLR_HOME).
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

# Project artifacts (build context: module root)
COPY target/osint-intelligence-solr-server.jar /opt/osint/osint-intelligence-solr-server.jar
COPY src/main/resources/conf/ /var/solr/data/${SOLR_CORE_NAME}/conf/
COPY src/main/resources/core.properties /var/solr/data/${SOLR_CORE_NAME}/core.properties
COPY run-app.sh /opt/osint/run-app.sh

RUN set -eux; \
    chmod +x /opt/osint/run-app.sh; \
    RUN_USER="$(cat /opt/osint/.run-user)"; \
    chown -R "$RUN_USER":"$RUN_USER" /opt/osint /var/solr/data/${SOLR_CORE_NAME}

# Run as official Solr user "solr", or custom "isr" if created above.
USER solr

EXPOSE 8983

ENTRYPOINT ["/bin/bash", "/opt/osint/run-app.sh"]
