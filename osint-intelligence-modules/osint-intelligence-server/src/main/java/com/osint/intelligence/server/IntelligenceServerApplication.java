package com.osint.intelligence.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IntelligenceServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(IntelligenceServerApplication.class, args);
    }
}
