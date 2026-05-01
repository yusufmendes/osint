package com.osint.intelligence.server.config;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.impl.Http2SolrClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class SolrConfig {

    @Bean
    public SolrClient solrClient(
            @Value("${intelligence.solr.base-url}") String baseUrl,
            @Value("${intelligence.solr.collection}") String collection,
            @Value("${intelligence.solr.request-timeout-millis}") long requestTimeoutMillis) {
        String url = baseUrl.endsWith("/") ? baseUrl + collection : baseUrl + "/" + collection;
        return new Http2SolrClient.Builder(url)
                .withRequestTimeout(requestTimeoutMillis, TimeUnit.MILLISECONDS)
                .build();
    }
}
