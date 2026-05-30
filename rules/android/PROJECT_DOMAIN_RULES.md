# Project Domain Rules

- Repositories are declared as interfaces in `shared/domain/repository` and implemented in `shared/domain/repository/impl`.
- Repository implementations receive `NetworkService`, DAO, and DataStore dependencies through constructor injection.
- Network responses in repositories are handled through `handleResponse` or `handleResponseResult`; mapping logic lives in `shared/domain/mapper/*Ktx.kt`.
- Interactor implementations receive the project's dispatcher abstraction and wrap suspend repository calls in `withContext(dispatchers.io)`.
- Add new repository and interactor implementations to their Hilt `@Binds` modules.
