---
name: new-data-layer
---

# New Data Layer

Creates or extends the project data/domain flow for a feature. Replace `{Feature}` with the domain name, `{feature}` with the lower camel-case name, `{featureTable}` with the Room table name, and `{package}` with the target package.

This skill covers repository, DAO, entity, mapper, interactor, and Hilt binding work.

Files usually created or touched:
- `shared/domain/repository/{Feature}Repository.kt`
- `shared/domain/repository/impl/{Feature}RepositoryImpl.kt`
- `shared/domain/interactor/{Feature}Interactor.kt`
- `shared/domain/interactor/impl/{Feature}InteractorImpl.kt`
- `shared/data/persistence/database/dao/{Feature}Dao.kt`
- `shared/data/persistence/database/entity/{Feature}Entity.kt`
- `shared/domain/mapper/*Ktx.kt`
- `shared/domain/repository/inject/RepositoryModule.kt`
- `shared/domain/interactor/inject/InteractorModule.kt`

---

## {Feature}Repository.kt

```kotlin
package {package}.repository

import kotlinx.coroutines.flow.Flow

interface {Feature}Repository {

    val {feature}EntitiesFlow: Flow<List<{Feature}Entity>>

    suspend fun load{Feature}Result(): Result<Unit>
}
```

Rules:
- Use `val` instead of `fun` for Flow accessors that have no parameters.
- Flow accessors are not `suspend`; they return a cold flow directly.
- Suspend methods that perform network calls return `Result<T>`.

---

## {Feature}RepositoryImpl.kt

```kotlin
package {package}.repository.impl

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import {package}.repository.{Feature}Repository

class {Feature}RepositoryImpl @Inject constructor(
    private val networkService: NetworkService,
    private val {feature}Dao: {Feature}Dao
): {Feature}Repository {

    override val {feature}EntitiesFlow: Flow<List<{Feature}Entity>>
        get() = {feature}Dao.{feature}EntitiesFlow

    override suspend fun load{Feature}Result(): Result<Unit> {
        return handleResponseResult(
            request = {
                val request = {Feature}Request(...)
                networkService.load{Feature}(request)
            }
        ).fold(
            onSuccess = { data ->
                {feature}Dao.upsert(data.map { it.to{Feature}Entity() })
                Result.success(Unit)
            },
            onFailure = { e -> Result.failure(e) }
        )
    }
}
```

Rules:
- Repository implementations perform network, DAO, and DataStore work.
- Always create `val request = ...` before calling `networkService`; never inline it inside the call.
- Use `handleResponseResult` for functions that return a value; use `handleResponse` for fire-and-forget.
- Mapping logic belongs in mapper KTX files; do not inline mapping in repository calls when it grows beyond trivial construction.

---

## {Feature}Dao.kt

```kotlin
package {package}.persistence.database.dao

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface {Feature}Dao {

    @get:Query("SELECT * FROM {featureTable}")
    val {feature}EntitiesFlow: Flow<List<{Feature}Entity>>

    @Query("SELECT * FROM {featureTable} WHERE id = :id")
    suspend fun findById(id: String): {Feature}Entity?

    @Upsert
    suspend fun upsert(entities: List<{Feature}Entity>)
}
```

Rules:
- Use `@get:Query` with `val` for Room Flow accessors that have no parameters; use `fun` when the query has parameters.
- Place all regular `fun` methods before any `suspend fun` methods.
- Use `@Upsert` instead of separate `@Insert`/`@Update`.
- Annotate methods returning Pojo types with `@Transaction`.

---

## {Feature}Entity.kt

```kotlin
package {package}.persistence.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "{featureTable}")
data class {Feature}Entity(
    @PrimaryKey val id: String,
    val name: String
) {
    companion object {
        val Empty = {Feature}Entity(id = "", name = "")
    }
}
```

---

## {Feature}Interactor.kt

```kotlin
package {package}.interactor

import kotlinx.coroutines.flow.Flow

interface {Feature}Interactor {

    val {feature}EntitiesFlow: Flow<List<{Feature}Entity>>

    suspend fun load{Feature}Result(): Result<Unit>
}
```

Rules:
- The interactor interface mirrors the repository interface exactly.
- Use `val` instead of `fun` for Flow accessors that have no parameters.
- Flow accessors are not `suspend`.

---

## {Feature}InteractorImpl.kt

```kotlin
package {package}.interactor.impl

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import {package}.interactor.{Feature}Interactor
import {package}.repository.{Feature}Repository

class {Feature}InteractorImpl @Inject constructor(
    private val dispatchers: CourierDispatchers,
    private val {feature}Repository: {Feature}Repository
): {Feature}Interactor {

    override val {feature}EntitiesFlow: Flow<List<{Feature}Entity>>
        get() = {feature}Repository.{feature}EntitiesFlow

    override suspend fun load{Feature}Result(): Result<Unit> {
        return withContext(dispatchers.io) { {feature}Repository.load{Feature}Result() }
    }
}
```

Rules:
- Interactor implementations wrap every suspend repository call in `withContext(dispatchers.io)`.
- Flow accessors delegate directly without `withContext`.
- No business logic belongs in the interactor; keep it in the repository or a dedicated use case.

---

## Modules

Add bindings to the existing Hilt modules:

```kotlin
@Binds
fun {feature}Repository(impl: {Feature}RepositoryImpl): {Feature}Repository

@Binds
fun {feature}Interactor(impl: {Feature}InteractorImpl): {Feature}Interactor
```

Also add the new interactor to the feature facade:

```kotlin
class Interactor @Inject constructor(
    ...,
    {feature}Interactor: {Feature}Interactor
): ...,
   {Feature}Interactor by {feature}Interactor
```
