# isr-auth-modules

ISR MVP authentication backend.

```
isr-auth-modules/
└─ isr-auth-backend/    Spring Boot 4.0.6, JWT, dummy users in application.yml
```

The POM is **self-contained** (no `<parent>`; the spring-boot-dependencies
BOM is imported directly). You can build it standalone *or* through the
thin aggregator at `../isr-mvp/pom.xml`.

## Build & test

```powershell
. ..\isr-tools\env.ps1
cd isr-auth-backend

mvn -B -ntp "-Dmaven.repo.local=$env:MAVEN_USER_HOME" test
mvn -B -ntp "-Dmaven.repo.local=$env:MAVEN_USER_HOME" package
```

Output: `target/isr-auth-backend.jar` (Spring Boot fat jar, ~27 MB).

## Run

```powershell
. ..\isr-tools\env.ps1
java -jar isr-auth-backend\target\isr-auth-backend.jar
```

Listens on `http://localhost:8081`. Endpoints:

```
POST /auth/login    -> { accessToken, expiresIn }
GET  /me            -> { userId, username, permissions[] }     (Bearer required)
POST /auth/logout   -> 204                                     (Bearer required)
GET  /actuator/health
```

## Demo users

| User    | Password    |
| ------- | ----------- |
| admin   | admin123    |
| viewer  | viewer123   |

Permissions are hardcoded in `src/main/resources/application.yml`.
