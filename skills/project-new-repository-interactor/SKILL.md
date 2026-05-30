---
name: project-new-repository-interactor
---

# Project New Repository And Interactor

Creates or extends a project domain data flow.

Files usually touched:
- `shared/domain/repository/{Feature}Repository.kt`
- `shared/domain/repository/impl/{Feature}RepositoryImpl.kt`
- `shared/domain/interactor/{Feature}Interactor.kt`
- `shared/domain/interactor/impl/{Feature}InteractorImpl.kt`
- `shared/domain/repository/inject/RepositoryModule.kt`
- `shared/domain/interactor/inject/InteractorModule.kt`
- `shared/domain/mapper/*Ktx.kt`

Rules:
- Repository implementations perform network, DAO, and DataStore work.
- Interactor implementations wrap suspend repository calls with `withContext(dispatchers.io)`.
- Use `handleResponse` / `handleResponseResult` for network responses.
- Put mapping in mapper KTX files; do not inline mapping in repository calls when it grows beyond trivial construction.
- Add new implementation bindings to Hilt `@Binds` modules.

Interactor shape:

```kotlin
class {Feature}InteractorImpl @Inject constructor(
    private val dispatchers: ProjectDispatchers,
    private val repository: {Feature}Repository
): {Feature}Interactor {

    override suspend fun load() {
        withContext(dispatchers.io) { repository.load() }
    }
}
```
