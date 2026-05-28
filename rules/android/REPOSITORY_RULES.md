# Repository Rules

- Always create `val request = ...` as a separate local variable before calling `networkService`; never inline request construction inside the `networkService` call arguments.
- Use `handleResponse` for network calls that do not return a value; use `handleResponseResult` only for calls inside functions that `return` a value.
- Do not use `try-catch-finally` in repositories; use `handleResponse` / `handleResponseResult` instead.
- Mapping logic belongs in mapper KTX files; do not write mappers inside repository methods.
- Bind each repository in `RepositoryModule` with `@Binds`.
