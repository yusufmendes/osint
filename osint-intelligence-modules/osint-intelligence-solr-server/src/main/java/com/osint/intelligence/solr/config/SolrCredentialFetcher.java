package com.osint.intelligence.solr.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;

/**
 * Solr admin kimlik bilgilerini, container icindeki run-app.sh
 * tarafindan kaynak olarak okunacak basit bir KEY=VALUE dosyasina yazar.
 *
 * <p>Su an icin sabit "admin"/"123" degerlerini uretir; ileride bir gizli
 * deposundan (vault, AWS SM, vs.) cekecek sekilde genisletilebilir.</p>
 *
 * <p>Cikti yolu argumanla verilebilir; verilmezse {@code /tmp/solr-credentials}
 * kullanilir. Bu yol run-app.sh ile uyumlu olmalidir.</p>
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
        System.out.println("[SolrCredentialFetcher] credentials yazildi: " + target.toAbsolutePath());
    }
}
