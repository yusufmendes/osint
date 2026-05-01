package com.osint.intelligence.server;

import org.apache.solr.client.solrj.SolrClient;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Smokes the Spring application context with PostGIS via Testcontainers and a mocked Solr client.
 */
@SpringBootTest
class IntelligenceServerSmokeTest extends AbstractPostgisIT {

    @TestConfiguration
    static class Mocks {
        @Bean
        @Primary
        SolrClient solrClient() {
            return Mockito.mock(SolrClient.class);
        }
    }

    @Autowired
    ApplicationContext context;

    @Test
    void contextLoads() {
        assertThat(context).isNotNull();
        assertThat(context.containsBean("intelligenceService")).isTrue();
        assertThat(context.containsBean("outboxWorker")).isTrue();
    }
}
