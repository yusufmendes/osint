package com.osint.intelligence.solr.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;

/**
 * Writes Solr admin credentials to a simple KEY=VALUE file for {@code run-app.sh}
 * inside the container to source.
 *
 * <p>Currently emits fixed {@code admin} / {@code 123}; can later be extended to read
 * from a secret store (Vault, AWS Secrets Manager, etc.).</p>
 *
 * <p>Output path is the first program argument; if omitted, {@code /tmp/solr-credentials}
 * is used. This path must stay aligned with {@code run-app.sh}.</p>
 */
public final class SolrCredentialFetcher {

    private static final String DEFAULT_OUTPUT = "/tmp/solr-credentials";
    private static final String DEFAULT_USER = "admin";
    private static final String DEFAULT_PASS = "123";

    private SolrCredentialFetcher() {
    }

    public static void main(String[] args) throws IOException {
        Path target = Paths.get(args.length > 0 ? args[0] : DEFAULT_OUTPUT);
        Path parent = target.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        List<String> lines = List.of(
                "SOLR_USER=" + DEFAULT_USER,
                "SOLR_PASS=" + DEFAULT_PASS
        );
        Files.write(
                target,
                lines,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE
        );
        System.out.println("[SolrCredentialFetcher] credentials written to: " + target.toAbsolutePath());
    }
}
