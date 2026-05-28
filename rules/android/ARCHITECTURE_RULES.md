# Architecture Rules

- Do not write mappers in repositories; place mapping logic in mapper KTX files.
- For each model, create a separate file; do not declare multiple model classes in one file.
- In repository network calls, always create request objects in a separate local `val request` before calling `networkService`; do not inline request construction or mapped request calls inside `networkService` arguments.
- In repositories, use `handleResponse` for network calls that do not return a value, and `handleResponseResult` only for calls inside functions that return a value via `return`; do not use `try-catch-finally` in repositories.
- When calling `handleResponse`, always provide all three named arguments: `request`, `onSuccess`, and `onFailure`; in `onFailure`, create a dedicated `data class` exception extending `ClientException` and throw it; catch that specific exception type in the ViewModel's `catch` function.
