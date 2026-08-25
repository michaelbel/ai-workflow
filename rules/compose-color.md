---
paths:
  - "**/*.gradle.kts"
  - "**/*.gradle"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила цвета Compose

- Используй цвета через `MaterialTheme.colorScheme`; не используй сырые константы `Color` для
  тематических цветов внутри компонентов.
- Добавляй новые UI-цвета в файл Colors UI kit и предоставляй их через `MaterialTheme.colorScheme`;
  не создавай локальные константы `private val ... = Color(...)` в файлах фич или компонентов.
- Называй новые расширения цветов `ColorScheme` по HTML/CSS-имени hex-цвета, соответствующему
  hex-значению, например `val ColorScheme.midnightBlue: Color get() = Color(0xFF251052)`; не называй
  их по назначению или использованию.
- В Material top app bar (`TopAppBar`, `CenterAlignedTopAppBar`, `LargeTopAppBar` и подобных)
  устанавливай цвета контейнера, иконки навигации, заголовка/подзаголовка и иконок действий через
  параметр `colors` с `TopAppBarDefaults.*topAppBarColors(...)`, когда API предоставляет эти цвета;
  не хардкодь цвета `Icon` или `Text` внутри слотов app bar, когда они могут наследоваться от
  `colors`.
