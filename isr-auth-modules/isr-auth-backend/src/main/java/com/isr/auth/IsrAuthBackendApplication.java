package com.isr.auth;

import com.isr.auth.config.AuthProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AuthProperties.class)
public class IsrAuthBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(IsrAuthBackendApplication.class, args);
    }
}
