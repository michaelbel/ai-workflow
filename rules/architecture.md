---
paths:
  - "**/*.gradle.kts"
  - "**/*.gradle"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила архитектуры

- Помещай логику маппинга в KTX-файлы мапперов.
- Для каждой модели создавай отдельный файл; не объявляй несколько классов моделей в одном файле.
- Для проверок уровня Android API сравнивай `Build.VERSION.SDK_INT` с числовыми уровнями API; не
  используй буквенные константы `Build.VERSION_CODES`, например используй
  `Build.VERSION.SDK_INT >= 31` вместо `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S`.
