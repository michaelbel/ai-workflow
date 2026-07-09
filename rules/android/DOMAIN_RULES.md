# Domain Rules

- Domain operations live in concrete `UseCase` and `FlowUseCase` classes under `shared/domain/usecase`.
- Room, Ktor, DataStore, and business logic dependencies are injected directly into the use case constructor.
- Network responses in use cases are handled through `handleResponse` or `handleResponseResult(...).getOrThrow()`; mapping logic lives in `shared/domain/mapper/*Ktx.kt`.
- Response-to-Entity mapper extension functions must be named `entity`, for example `fun ItemResponse.entity(...): ItemEntity`.
- Response-list-to-Entity-list mapper extension functions must be named `entities`, for example `fun List<ItemResponse>.entities(...): List<ItemEntity>`.
- In Response-to-Entity mappers, put mapper function parameters and target entity constructor arguments on separate lines.
- In Response-to-Entity mappers, use `orEmpty` defaults instead of Elvis default values: `String?.orEmpty()` for strings and nullable primitive `orEmpty` extension properties for primitive values.
- Response-to-Entity mappers must return non-null entity values; do not return nullable entities or use `return null` / `mapNotNull` for missing response fields. Fill nullable response fields with the project's `orEmpty` defaults.
- Keep nullable primitive default helpers in `shared/domain/mapper/PrimitiveKtx.kt`; create this file when it is missing and add new nullable primitive `orEmpty` properties there.
- The base `UseCase` / `FlowUseCase` class owns dispatcher switching; do not add `withContext` or `flowOn` inside implementations.
- ViewModels inject specific use cases and call one-shot use cases with `.getOrThrow()` inside `launch { ... }`.
