package com.osint.intelligence.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "intelligence")
public class IntelligenceProperties {

    private final Outbox outbox = new Outbox();
    private final CombinedSearch combinedSearch = new CombinedSearch();
    private final Solr solr = new Solr();

    public Outbox getOutbox() { return outbox; }
    public CombinedSearch getCombinedSearch() { return combinedSearch; }
    public Solr getSolr() { return solr; }

    public static class Outbox {
        private long pollMillis = 1000;
        private int batchSize = 100;
        private int maxAttempts = 5;

        public long getPollMillis() { return pollMillis; }
        public void setPollMillis(long pollMillis) { this.pollMillis = pollMillis; }
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
    }

    public static class CombinedSearch {
        private int solrRowCap = 5000;
        public int getSolrRowCap() { return solrRowCap; }
        public void setSolrRowCap(int solrRowCap) { this.solrRowCap = solrRowCap; }
    }

    public static class Solr {
        private String baseUrl;
        private String collection;
        private long requestTimeoutMillis = 10_000;

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public String getCollection() { return collection; }
        public void setCollection(String collection) { this.collection = collection; }
        public long getRequestTimeoutMillis() { return requestTimeoutMillis; }
        public void setRequestTimeoutMillis(long requestTimeoutMillis) { this.requestTimeoutMillis = requestTimeoutMillis; }
    }
}
