# osint-intelligence-solr-server

Intelligence modulu icin Solr `intelligence` core'unu yerelde veya Docker'da
calistirmak icin build ve run direktifleri.

Tasarim, Maven plugin akislari ve Docker ic mekanizmasi icin bkz.
[DesignAndImplementationDetail.md](DesignAndImplementationDetail.md).

## Gereksinimler

- **Java 21** (ornek: repo kokunden `osint-tools` izole toolchain)

  ```powershell
  cd D:\osint
  . .\osint-tools\env.ps1
  java -version   # 21.x beklenir
  mvn -version
  ```

- **Maven 3.9+**
- **Ag erisimi** (ilk build'de Solr `.tgz` arsivden indirilir; cache kullanilir)
- **Docker** (yalniz `-Pdeployment` ile imaj build edeceksen)

## Hizli baslangic (yerel)

### 1. `SOLR_HOME` (kalici veri ve instance)

`SOLR_HOME`, core ve indekslerin tutuldugu dizindir; `mvn clean` bunu silmez.

PowerShell (kalici, yeni oturumlar icin):

```powershell
setx SOLR_HOME "D:\path\to\solr-home"
```

Mevcut oturum icin:

```powershell
$env:SOLR_HOME = "D:\path\to\solr-home"
```

bash/zsh:

```bash
export SOLR_HOME="$HOME/solr-home"
```

### 2. Bir kerelik: distrodan `conf/` baseline

Apache Solr 9.x binary yalnizca `.tgz` olarak yayinlanir. Asagidaki komut
distroyu indirip acar ve `server/solr/configsets/_default/conf` icerigini
`src/main/resources/conf/` altina kopyalar (repoya commit edilebilir).

```powershell
cd D:\osint\osint-intelligence-modules\osint-intelligence-solr-server
mvn process-resources -Pseed-conf
```

### 3. Build (jar + distro unpack + `SOLR_HOME` senkronu)

```powershell
mvn package
```

- `SOLR_HOME` tanimli degilse build, `process-resources` sirasinda hata verir
  (fail-fast). Gecici olarak senkronu atlamak icin:
  `mvn package -Dsync.home.skip=true`
- `src/main/resources/conf/solrconfig.xml` yoksa once `seed-conf` adimini
  calistir.

### 4. Solr baslat / durdur

```powershell
mvn exec:exec@solr-start
mvn exec:exec@solr-stop
```

- Windows'ta POM otomatik olarak `solr.cmd` kullanir.
- Varsayilan port: **8983** (`solr.port` ile degistirilebilir).

### 5. Dogrulama

Tarayici veya HTTP istemcisi:

- Admin: `http://localhost:8983/solr/admin/info/system`
- Core: `http://localhost:8983/solr/intelligence/select?q=*:*&wt=json`

## Docker (deployment profili)

Shade jar + `Dockerfile` ile imaj build:

```powershell
mvn -Pdeployment package
```

Varsayilan imaj adi: `osint/intelligence-solr:0.1.0` (`docker.image.name` ve
`project.version` ile uyumlu).

Calistirma:

```powershell
docker run -p 8983:8983 osint/intelligence-solr:0.1.0
```

Container icinde `run-app.sh` once credential jar'ini calistirir, sonra Solr'i
baslatir; ayrintilar [DesignAndImplementationDetail.md](DesignAndImplementationDetail.md).

## Ozet komut tablosu

| Amac | Komut |
|------|--------|
| Conf baseline (bir kerelik) | `mvn process-resources -Pseed-conf` |
| Tam build + `SOLR_HOME` sync | `mvn package` |
| Senkronu atla | `mvn package -Dsync.home.skip=true` |
| Solr baslat | `mvn exec:exec@solr-start` |
| Solr durdur | `mvn exec:exec@solr-stop` |
| Docker imaji | `mvn -Pdeployment package` |

## Maven property ozeti

| Property | Varsayilan | Aciklama |
|----------|------------|----------|
| `solr.version` | `9.10.1` | Distro indirme + Docker `FROM solr:...` |
| `solr.core.name` | `intelligence` | Core adi |
| `solr.port` | `8983` | Yerel start/stop portu |
| `docker.image.name` | `osint/intelligence-solr` | Docker imaj adi |

## Frontend ile uyum

`osint-intelligence-web` varsayilan Solr URL'si:

`http://localhost:8983/solr/intelligence` — core adi `intelligence` ile
eslesmelidir.

## Sorun giderme

- **`SOLR_HOME ... not found` (stop):** Stop komutu icin de ayni oturumda
  `$env:SOLR_HOME` set edilmeli; `setx` sonrasi yeni shell ac.
- **Ilk `solr-start` uzun surer:** `exec-maven-plugin` ve Solr ilk kez
  indirilir / JVM ayaga kalkar; sonraki calismalar daha hizli olur.
- **Port mesgul:** Baska bir Solr 8983'te ise `solr.port` property'sini
  degistir veya diger sureci durdur.
