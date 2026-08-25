---
paths:
  - "**/*.gradle.kts"
  - "**/*.gradle"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила типографики

- Всегда устанавливай стиль текста через аргумент `style` в `Text` или `SharedFixedText`; никогда
  не используй отдельные аргументы `fontSize`, `fontWeight` или `color`.
- Используй расширения `MaterialTheme.typography.<token>` как базовый стиль, затем применяй
  переопределения через
  `.copy(color = ..., lineHeight = ..., letterSpacing = ..., textAlign = ...)`.
- В `Text` держи визуальные поля стиля текста внутри `style`: `color`, `lineHeight`, `letterSpacing`
  и `textAlign`; не передавай их как отдельные аргументы `Text`.
- Не выделяй `MaterialTheme.typography...copy(...)` в локальные переменные вроде
  `val fieldTextStyle`; передавай выражение стиля напрямую в composable, даже если оно дублирует
  соседний код стиля.
- Не создавай `TextStyle(...)` напрямую внутри composable; всегда начинай с токена
  `MaterialTheme.typography`.
- Доступные токены следуют паттерну `regular<size>` (насыщенность 400) и `medium<size>`
  (насыщенность 500): `regular12`, `regular14`, `regular15`, `regular16`, `regular18`, `regular22`,
  `medium11`, `medium12`, `medium14`, `medium16`, `medium17`, `medium22`. Используй токен, размер и
  насыщенность которого соответствуют дизайну; не создавай ad-hoc экземпляры `TextStyle`,
  приближающие существующий токен.
- Для `textAlign` передавай его внутри `.copy(textAlign = ...)` на стиле, а не как отдельный
  аргумент `textAlign` в `Text`.
- Для span-ов `AnnotatedString` используй `MaterialTheme.typography.spanRegular14` или
  `spanMedium14` как базу `SpanStyle`.
- Не хардкодь цвета внутри `TextStyle`; всегда ссылайся на `MaterialTheme.colorScheme.*`.
