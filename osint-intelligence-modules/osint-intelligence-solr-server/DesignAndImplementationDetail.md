# Design and implementation detail — osint-intelligence-solr-server

Bu belge, modulun tasarimini, Maven/Docker akislarini ve yerel ile container
ortamlari arasindaki farklari ozetler. Build ve run komutlari icin bkz.
[README.md](README.md).

## Amaç

- Yerel gelistirmede: Solr binary distrosunu **sadece `target/` altinda**
  tutmak; indeks ve instance layout'u **`SOLR_HOME` ortam degiskeni** ile
  kullanicinin sectigi kalici dizinde tutmak (`mvn clean` indeksi silmez).
- Docker'da: resmi `solr` imaji uzerinde **credential uretimi** ve Solr
  baslatma akisini `run-app.sh` ile sabitlemek.

## Kaynak gereksinim dokumani

Orijinal is gerekleri: `osint-intelligence-modules/isr-intelligence-solr-server.md`
(ust dizinde). Uygulama sirasinda asagidaki teknik kararlar alindi:

- Solr 9.x **binary Maven Central'da zip olarak yok**; resmi arsivden `.tgz`
  indirilir (`download-maven-plugin` + `unpack=true`).
- Yerel profilde **ekstra credential dosyasi yok**; Solr fabrika guvenligi
  (tipik olarak Basic Auth kapali).
- `src/main/resources/conf/` baslangici, distrodaki
  `server/solr/configsets/_default/conf` ile doldurulur (`-Pseed-conf`).

## Dizin yapisi (modul)

```
osint-intelligence-modules/osint-intelligence-solr-server/
├── pom.xml
├── Dockerfile
├── run-app.sh
├── README.md
├── DesignAndImplementationDetail.md
└── src/main/
    ├── java/com/osint/intelligence/solr/config/SolrCredentialFetcher.java
    └── resources/
        ├── core.properties              (name=intelligence)
        └── conf/                        (seed-conf ile _default'tan)
            ├── solrconfig.xml
            ├── managed-schema.xml
            └── ...
```

## Iki calisma modu

### A) Default profil (yerel)

| Bilesen | Rol |
|---------|-----|
| `download-maven-plugin` | `solr.distro.url` (.tgz) indir + `target/` altina ac |
| `maven-antrun` `sync-home` | `src/main/resources/conf/**` ve `core.properties` -> `${SOLR_HOME}/${solr.core.name}/`; distro `server/solr/solr.xml` -> `${SOLR_HOME}/solr.xml` (yalniz yoksa kopyala) |
| `maven-shade-plugin` | Tek jar; Main-Class: `SolrCredentialFetcher` (Docker icin) |
| `exec-maven-plugin` | `bin/solr start -p <port> -s <SOLR_HOME>` / `stop -p <port>` |

**Veri koruma:** `sync-home` yalniz `conf/` ve `core.properties` uzerine yazar;
mevcut `data/` ve indeks dosyalarina dokunmaz.

**Fail-fast:**

- `SOLR_HOME` tanimli degilse `sync-home` hata verir.
- `src/main/resources/conf/solrconfig.xml` yoksa seed oncesi hata verir.

### B) `deployment` profili (Docker)

| Ozellik | Deger |
|---------|--------|
| `unpack.solr.skip` | `true` — yerel distro indirme yok |
| `sync.home.skip` | `true` — yerel `SOLR_HOME` senkronu yok |
| `docker-maven-plugin` | `package` fazinda `docker:build`; context modul kok, `Dockerfile` |

Imaj icinde:

1. Shade jar `/opt/osint/osint-intelligence-solr-server.jar`
2. `run-app.sh` entrypoint
3. `SolrCredentialFetcher` `/tmp/solr-credentials` dosyasina
   `SOLR_USER=admin`, `SOLR_PASS=123` yazar (shell-friendly)
4. Script bu satirlari okuyup export eder, `exec solr-foreground` ile Solr baslar

**Not:** Ham Solr `/tmp/solr-credentials` dosyasini dogrudan okumaz; shell
katmani credential'lari ortama tasir (ileride `SOLR_OPTS` veya
`security.json` entegrasyonu icin genisletilebilir).

## Dockerfile ozeti

- `ARG SOLR_VERSION` / `FROM solr:${SOLR_VERSION}` — POM `solr.version` ile
  hizali tutulmali.
- `USER root`: jar, `conf/`, `core.properties`, `run-app.sh` kopyalanir;
  `/var/solr/data/${SOLR_CORE_NAME}` altina core yerlestirilir.
- Kullanici: resmi imajda `solr` varsa o; yoksa `isr` kullanici olusturulur
  (belgedeki istege uyum).
- Opsiyonel: imajda `java` yoksa JRE kurulum denemesi (defansif).

## `SolrCredentialFetcher`

- Paket: `com.osint.intelligence.solr.config`
- `main`: ilk arguman cikti dosya yolu; yoksa `/tmp/solr-credentials`
- Cikti formati: `SOLR_USER=...` ve `SOLR_PASS=...` (satir basina bir atama)

## Maven profilleri

| Profil | Tetikleme | Etki |
|--------|-------------|------|
| `windows` | OS family | `solr.bin=solr.cmd` |
| `seed-conf` | `-Pseed-conf` | `seed-conf` antrun calisir, `sync-home` bu fazda skip |
| `deployment` | `-Pdeployment` | distro fetch + sync skip; Docker build |

## Dis bagimliliklar ve surumler

- Solr binary: `https://archive.apache.org/dist/solr/solr/${solr.version}/solr-${solr.version}.tgz`
- Plugin sabitleri (POM): `maven-compiler-plugin` 3.13.0, `maven-shade-plugin` 3.6.0,
  `maven-antrun-plugin` 3.1.0, `exec-maven-plugin` 3.5.0,
  `download-maven-plugin` 1.13.0, `docker-maven-plugin` (fabric8) 0.46.0

## Bilinen sinirlar ve gelecek notlari

- **Solr 10:** CLI, gelecekte varsayilan modun SolrCloud olacagini uyarir;
  standalone icin `--user-managed` gibi flag'ler gerekebilir — surum
  yukseltmesinde `exec` argumanlari guncellenmeli.
- **Guvenlik:** `admin`/`123` yalnizca iskelet; production'da gercek kimlik
  kaynagi + `security.json` / plugin yapilandirmasi gerekir.
- **JDK:** POM `release=21`; daha eski JDK ile derleme basarisiz olur.

## Dogrulama checklist (gelistirici)

1. `mvn process-resources -Pseed-conf` — `src/main/resources/conf` dolu
2. `SOLR_HOME` set + `mvn package` — sync basarili
3. `mvn exec:exec@solr-start` — port 8983 ayakta
4. `GET /solr/intelligence/select?q=*:*` — HTTP 200
5. `mvn exec:exec@solr-stop` — surec durur
6. `mvn -Pdeployment package` — Docker imaji uretilir (Docker daemon gerekli)
