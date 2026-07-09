# Architecture Rules

- Do not write mappers inside use cases; place mapping logic in mapper KTX files.
- For each model, create a separate file; do not declare multiple model classes in one file.
- For Android API level checks, compare `Build.VERSION.SDK_INT` with numeric API levels; do not use lettered `Build.VERSION_CODES` constants, for example use `Build.VERSION.SDK_INT >= 31` instead of `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S`.
- In use case network calls, always create request objects in a separate local `val request` inside `request = { ... }` before calling `networkService`; do not build the request outside the lambda, inline request construction, or pass mapped request calls directly inside `networkService` arguments.
- In use cases, use `handleResponse` for callback-style network calls and `handleResponseResult(...).getOrThrow()` when consuming the response as a value; do not wrap use case results manually with `Result.success` / `Result.failure`.
- When calling `handleResponse`, always provide all three named arguments: `request`, `onSuccess`, and `onFailure`; in `onFailure`, create a dedicated `data class` exception extending the project base network exception and throw it; catch that specific exception type in the ViewModel's `catch` function.
