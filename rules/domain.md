---
paths:
  - "**/*.gradle.kts"
  - "**/*.gradle"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила Domain

- Операции domain-слоя находятся в конкретных классах `UseCase` и `FlowUseCase` в
  `shared/domain/usecase`.
- Зависимости Room, Ktor, DataStore и бизнес-логики внедряются напрямую в конструктор use case.
- Сетевые ответы в use case обрабатываются через `handleResponse` или
  `handleResponseResult(...).getOrThrow()`. Когда generic network failure нужно классифицировать как
  endpoint-specific exception, используй `getOrElse`, пробрось `CancellationException` и выбрось
  конкретное исключение; логика маппинга находится в `shared/domain/mapper/*Ktx.kt`.
- Функции-расширения мапперов Response→Entity должны называться `entity`, например
  `fun ItemResponse.entity(...): ItemEntity`.
- Функции-расширения мапперов список Response→список Entity должны называться `entities`, например
  `fun List<ItemResponse>.entities(...): List<ItemEntity>`.
- В мапперах Response→Entity размещай параметры функции маппера и аргументы конструктора целевой
  entity на отдельных строках.
- В мапперах Response→Entity используй значения по умолчанию `orEmpty` вместо Elvis-операторов:
  `String?.orEmpty()` для строк и nullable примитивные свойства-расширения `orEmpty` для примитивных
  значений.
- Мапперы Response→Entity должны возвращать non-null значения entity; не возвращай nullable entity и
  не используй `return null` / `mapNotNull` для отсутствующих полей ответа. Заполняй nullable поля
  ответа значениями по умолчанию `orEmpty` проекта.
- Держи хелперы значений по умолчанию для nullable примитивов в
  `shared/domain/mapper/PrimitiveKtx.kt`; создавай этот файл, если он отсутствует, и добавляй туда
  новые nullable примитивные свойства `orEmpty`.
- Базовый класс `UseCase` / `FlowUseCase` сам отвечает за переключение диспетчеров; не добавляй
  `withContext` или `flowOn` внутри реализаций.
- ViewModel-и внедряют конкретные use case и вызывают одноразовые use case с `.getOrThrow()` внутри
  `launch { ... }`.
