---
paths:
  - "**/*.kt"
---

# Правила безопасности

Базовые требования по безопасности для Kotlin/Android/KMP-кода, сжатые из OWASP MASVS и Mobile
Top 10 (2024). Это стандарты, которые соблюдаются при написании кода; полный доказательный
аудит с threat model и эксплуатационными сценариями делает агент `security-auditor`, массовый
проход по модулям — workflow `security-sweep`.

## Секреты и конфигурация сборки

- Не коммить ключи, токены, пароли, keystore и `google-services.json` с реальными ключами; храни
  их в `local.properties` (в `.gitignore`), в переменных окружения CI или в секрет-хранилище.
- Не клади секреты в `BuildConfig` и в ресурсы: значения из `BuildConfig` тривиально достаются из
  APK. Для клиентских идентификаторов, которые всё равно попадают в бинарь, полагайся на
  серверную проверку, а не на «скрытость».
- `.gitignore` должен содержать `local.properties`, `*.jks`, `*.keystore`, `*.p12`, `*.pem`,
  `secrets*.properties`.
- В KMP секреты не размещай в `commonMain`; платформенные ключи подаются через `expect/actual`
  провайдер, который на каждой платформе читает из защищённого хранилища.

## Транспорт

- Только HTTPS. В `AndroidManifest.xml` держи `android:usesCleartextTraffic="false"`; исключения
  оформляй через `network_security_config.xml` с явным списком доменов и только для отладки.
- Certificate pinning для собственного backend:
  - OkHttp — `CertificatePinner` с pin-set из SPKI SHA-256 leaf/intermediate сертификата.
  - Ktor (Darwin/OkHttp engine) — pinning на уровне engine-конфига соответствующей платформы.
  - Всегда закладывай минимум два пина (текущий + запасной) и документируй дату ротации; пин без
    запасного превращает продление сертификата в отказ обслуживания.
- Не отключай проверку хоста и не подставляй `TrustManager`, принимающий все сертификаты, даже
  во flavor'ах для тестирования, которые могут случайно уехать в релиз.

## Хранение данных

- Чувствительные данные (токены сессии, PII) — только в шифрованном хранилище:
  `EncryptedSharedPreferences` / шифрованный `DataStore` с ключом из `MasterKey`
  (`AES256_GCM`), либо Android Keystore напрямую.
- Не пиши чувствительные данные в обычный `SharedPreferences`, в файлы на внешнем хранилище, в
  имена файлов кэша и в логи.
- Room-база с чувствительными данными — SQLCipher или хранение только зашифрованных значений;
  ключ БД не хардкодь.
- `android:allowBackup` — выключай (`false`) либо задавай `fullBackupContent` / `dataExtractionRules`,
  исключающие секретные файлы, иначе токены утекут в облачный бэкап.

## Манифест и экспорт компонентов

- Каждому `activity`/`service`/`receiver`/`provider` явно проставляй `android:exported`;
  `exported="true"` без строгой проверки вызывающего — потенциальный вектор.
- Экспортированные компоненты, принимающие `Intent`, валидируют все extras и `data`-URI;
  `ContentProvider` с `grantUriPermissions` — только на конкретные пути; deep links не дают
  доступ к привилегированным экранам без проверки авторизации.
- Детальный разбор Intent-поверхности (redirection, implicit intents, `PendingIntent`
  mutability) — скилл `android-intent-security` из маркетплейса `android-skills`.

## Логирование и релизный билд

- В релизе не логируй PII, токены, тела запросов/ответов. ProGuard/R8-правило вырезает `Log.*` и
  `println` из релиза:

  ```proguard
  -assumenosideeffects class android.util.Log {
      public static int v(...);
      public static int d(...);
      public static int i(...);
      public static int w(...);
      public static int e(...);
  }
  ```

- Релизный билд: `isMinifyEnabled = true`, `isShrinkResources = true`, R8 full mode
  (`android.enableR8.fullMode=true`). Проверяй, что `mapping.txt` сгенерирован и загружен в
  Play Console / crash-репортер.
- `isDebuggable` в релизе — только `false`. `BuildConfig.DEBUG`-ветки не должны открывать
  тестовые бэкдоры в релизной конфигурации.

## Аутентификация и криптография

- Не изобретай криптографию: `javax.crypto` / Tink / платформенные API. AES только в режиме с
  аутентификацией (`GCM`), IV — случайный на каждое сообщение, не переиспользуется.
- Биометрия — `BiometricPrompt` с `CryptoObject`, привязанным к ключу Keystore
  (`setUserAuthenticationRequired(true)`); «биометрия ради галочки» без `CryptoObject` не
  защищает данные.
- Play Integrity API для проверки целостности клиента там, где это оправдано: nonce генерируется
  на сервере, ответ верифицируется на сервере, вердикт не кэшируется на клиенте.
- Токены сессии — короткоживущие, обновляются по refresh-токену; логаут инвалидирует токены и на
  сервере, и в локальном хранилище.

## Supply chain

- Версии зависимостей — только через version catalog; не тяни динамические версии (`+`,
  `latest.release`).
- Включай dependency verification (`gradle/verification-metadata.xml`) или как минимум
  dependency review в CI.
- Плагины Gradle и GitHub Actions пинуй: экшены — по полному commit SHA, не по mutable-тегу.

## Чек-лист перед релизом

- [ ] в диффе и в истории нет секретов (`git log -p`, secret-scanner)
- [ ] `usesCleartextTraffic=false`, network security config без общих исключений
- [ ] certificate pinning для собственного backend, есть запасной пин
- [ ] чувствительные данные только в шифрованном хранилище
- [ ] `allowBackup=false` или бэкап-правила исключают секреты
- [ ] у всех компонентов явный `exported`, экспортированные валидируют вход
- [ ] R8 full mode, `Log.*` вырезан, `mapping.txt` сохранён
- [ ] `isDebuggable=false`, нет debug-бэкдоров
- [ ] биометрия через `CryptoObject`, крипто — только аутентифицированные режимы
- [ ] версии зависимостей зафиксированы, экшены пиннятся по SHA
