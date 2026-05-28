---
name: new-feature-data-layer
---

# New Feature Data Layer

Creates the data layer for a new feature: Repository interface, RepositoryImpl, DAO, and Hilt binding. Replace `{Feature}` with the domain name (e.g. `Cargo`, `Payment`, `Routes`) and `{package}` with the target package.

Four files must be created, plus one existing file updated.

---

## {Feature}Repository.kt

```kotlin
package {package}.repository

import kotlinx.coroutines.flow.Flow

interface {Feature}Repository {

    fun {feature}EntitiesFlow(): Flow<List<{Feature}Entity>>

    suspend fun load{Feature}Result(): Result<Unit>
}
```

Rules:
- Flow methods are not `suspend` — they return a cold flow directly.
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

    override fun {feature}EntitiesFlow(): Flow<List<{Feature}Entity>> {
        return {feature}Dao.{feature}EntitiesFlow()
    }

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
- Always create `val request = ...` before calling `networkService`; never inline it inside the call.
- Use `handleResponseResult` for functions that `return` a value; use `handleResponse` for fire-and-forget.
- Mapping logic belongs in mapper KTX files, not here.

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

    @Query("SELECT * FROM {featureTable}")
    fun {feature}EntitiesFlow(): Flow<List<{Feature}Entity>>

    @Query("SELECT * FROM {featureTable} WHERE id = :id")
    suspend fun findById(id: String): {Feature}Entity?

    @Upsert
    suspend fun upsert(entities: List<{Feature}Entity>)
}
```

Rules:
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

## RepositoryModule.kt (update existing)

Add a binding to the existing `RepositoryModule`:

```kotlin
@Binds
fun {feature}Repository(impl: {Feature}RepositoryImpl): {Feature}Repository
```
