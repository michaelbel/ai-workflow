# Architecture Rules

- Do not write mappers in repositories; place mapping logic in mapper KTX files.
- For each model, create a separate file; do not declare multiple model classes in one file.
- For Android API level checks, compare `Build.VERSION.SDK_INT` with numeric API levels; do not use lettered `Build.VERSION_CODES` constants, for example use `Build.VERSION.SDK_INT >= 31` instead of `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S`.
- In repository network calls, always create request objects in a separate local `val request` before calling `networkService`; do not inline request construction or mapped request calls inside `networkService` arguments.
- In repositories, use `handleResponse` for network calls that do not return a value, and `handleResponseResult` only for calls inside functions that return a value via `return`; do not use `try-catch-finally` in repositories.
- When calling `handleResponse`, always provide all three named arguments: `request`, `onSuccess`, and `onFailure`; in `onFailure`, create a dedicated `data class` exception extending the project base network exception and throw it; catch that specific exception type in the ViewModel's `catch` function.
