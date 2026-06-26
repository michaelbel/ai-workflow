# Domain Rules

- Domain operations live in concrete `UseCase` and `FlowUseCase` classes under `shared/domain/usecase`.
- Room, Ktor, DataStore, and business logic dependencies are injected directly into the use case constructor.
- Network responses in use cases are handled through `handleResponse` or `handleResponseResult(...).getOrThrow()`; mapping logic lives in `shared/domain/mapper/*Ktx.kt`.
- The base `UseCase` / `FlowUseCase` class owns dispatcher switching; do not add `withContext` or `flowOn` inside implementations.
- ViewModels inject specific use cases and call one-shot use cases with `.getOrThrow()` inside `launch { ... }`.
