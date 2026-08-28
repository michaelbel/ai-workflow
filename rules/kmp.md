---
description: >-
  Синхронное обновление версии приложения во всех таргетах: androidApp, desktopApp, iosAppCompose и
  iosApp Version.xcconfig
paths:
  - "**/*.gradle.kts"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

- При обновлении версии приложения обновляй её во всех таргетах: `androidApp/build.gradle.kts`
  (`versionName`), `desktopApp/build.gradle.kts` (`desktopVersionName`),
  `iosAppCompose/build.gradle.kts` (`iosVersionName`) и `iosApp/Configuration/Version.xcconfig`
  (`MARKETING_VERSION`).
