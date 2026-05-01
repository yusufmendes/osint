package com.osint.intelligence.server.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(IntelligenceProperties.class)
public class PropertiesConfig {
}
