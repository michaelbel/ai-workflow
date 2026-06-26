---
name: new-data-layer
---

# New Data Layer

Creates or extends the project data/domain flow for a feature using `UseCase` and `FlowUseCase`. Replace `{Feature}` with the domain name, `{feature}` with the lower camel-case name, `{featureTable}` with the Room table name, and `{package}` with the target package.

This skill covers DAO, entity, mapper, request/response models, one-shot use cases, and flow use cases. New data work does not create Repository or Interactor layers.

Files usually created or touched:
- `shared/domain/usecase/{Feature}UseCase.kt`
- `shared/domain/usecase/{Feature}FlowUseCase.kt`
- `shared/data/persistence/database/dao/{Feature}Dao.kt`
- `shared/data/persistence/database/entity/{Feature}Entity.kt`
- `shared/data/network/request/{Feature}Request.kt`
- `shared/data/network/response/{Feature}Response.kt`
- `shared/domain/mapper/*Ktx.kt`
- `shared/data/persistence/database/AppDatabase.kt`
- `shared/data/network/NetworkService.kt`

---

## One-Shot UseCase With One Parameter

Use this for suspend Room/Ktor/DataStore work that returns a single result.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

package {package}.usecase

import androidx.room.withTransaction
import javax.inject.Inject
import ru.mercury.courier.shared.coroutines.SharedDispatchers
import ru.mercury.courier.shared.data.{Feature}Id
import ru.mercury.courier.shared.data.error.{Feature}Exception
import ru.mercury.courier.shared.data.network.NetworkService
import ru.mercury.courier.shared.data.network.request.{Feature}Request
import ru.mercury.courier.shared.data.persistence.database.AppDatabase
import ru.mercury.courier.shared.data.persistence.database.dao.{Feature}Dao
import ru.mercury.courier.shared.domain.mapper.entity
import ru.mercury.courier.shared.domain.mapper.handleResponse
import ru.mercury.courier.shared.domain.usecase.UseCase

class Load{Feature}UseCase @Inject constructor(
    private val networkService: NetworkService,
    private val database: AppDatabase,
    private val {feature}Dao: {Feature}Dao,
    dispatchers: SharedDispatchers
): UseCase<{Feature}Id, Unit>(dispatchers.io) {

    override suspend fun execute({feature}Id: {Feature}Id) {
        handleResponse(
            request = {
                val request = {Feature}Request({feature}Id)
                networkService.load{Feature}(request)
            },
            onSuccess = { data ->
                database.withTransaction {
                    {feature}Dao.upsert(data.entity)
                }
            },
            onFailure = { error -> throw {Feature}Exception(error.message) }
        )
    }
}
```

Rules:
- Add `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")` when the single `params` argument is renamed to a semantic name.
- Pass `dispatchers.io` for Room and Ktor work.
- Do not return `Result`; `UseCase` wraps `execute` in `Result`.
- Throw a domain-specific exception from `onFailure`.
- Create `val request = ...` before calling `networkService`.

---

## One-Shot UseCase With Params

Use a nested `Params` data class when there are two or more input values.

```kotlin
package {package}.usecase

import javax.inject.Inject
import ru.mercury.courier.shared.coroutines.SharedDispatchers
import ru.mercury.courier.shared.data.{Feature}Id
import ru.mercury.courier.shared.data.UserId
import ru.mercury.courier.shared.data.persistence.database.dao.{Feature}Dao
import ru.mercury.courier.shared.domain.usecase.UseCase

class Save{Feature}UseCase @Inject constructor(
    private val {feature}Dao: {Feature}Dao,
    dispatchers: SharedDispatchers
): UseCase<Save{Feature}UseCase.Params, Unit>(dispatchers.io) {

    override suspend fun execute(params: Params) {
        {feature}Dao.update(params.{feature}Id, params.userId)
    }

    data class Params(
        val {feature}Id: {Feature}Id,
        val userId: UserId
    )
}
```

Rules:
- Keep `Params` nested inside the use case.
- Do not use `Pair`, `Triple`, maps, or multiple `invoke` arguments.
- Create params at the call site with `{Feature}UseCase.Params(...)`.

---

## FlowUseCase

Use this for Room Flow or other observable streams.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

package {package}.usecase

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import ru.mercury.courier.shared.coroutines.SharedDispatchers
import ru.mercury.courier.shared.data.{Feature}Id
import ru.mercury.courier.shared.data.persistence.database.dao.{Feature}Dao
import ru.mercury.courier.shared.data.persistence.database.entity.{Feature}Entity
import ru.mercury.courier.shared.domain.usecase.FlowUseCase

class {Feature}EntityFlowUseCase @Inject constructor(
    private val {feature}Dao: {Feature}Dao,
    dispatchers: SharedDispatchers
): FlowUseCase<{Feature}Id, {Feature}Entity>(dispatchers.io) {

    override fun execute({feature}Id: {Feature}Id): Flow<{Feature}Entity> {
        return {feature}Dao.selectFlow({feature}Id)
    }
}
```

Rules:
- `execute` is not `suspend`.
- Return the DAO Flow directly.
- Do not call `flowOn`; the base `FlowUseCase` applies it.
- Do not wrap Flow values in `Result`.
- If the flow has two or more input values, use nested `Params` exactly like one-shot use cases.

---

## Network Result Values

Use `handleResponseResult(...).getOrThrow()` when the network response is needed as a value before continuing.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class {Feature}UseCase @Inject constructor(
    private val networkService: NetworkService,
    private val {feature}Dao: {Feature}Dao,
    dispatchers: SharedDispatchers
): UseCase<{Feature}Id, {Feature}Entity>(dispatchers.io) {

    override suspend fun execute({feature}Id: {Feature}Id): {Feature}Entity {
        val data = handleResponseResult {
            val request = {Feature}Request({feature}Id)
            networkService.load{Feature}(request)
        }.getOrThrow()

        val entity = data.entity
        {feature}Dao.upsert(entity)
        return entity
    }
}
```

Rules:
- Do not return `handleResponseResult` from `execute`.
- Do not wrap the result with `Result.success` / `Result.failure`.
- Let `.getOrThrow()` propagate failures into the base `UseCase`.

---

## Composing UseCases

When one use case calls another, unwrap the result with `getOrThrow()` so the parent use case fails consistently.

```kotlin
class Reload{Feature}UseCase @Inject constructor(
    private val load{Feature}UseCase: Load{Feature}UseCase,
    private val save{Feature}UseCase: Save{Feature}UseCase,
    dispatchers: SharedDispatchers
): UseCase<Reload{Feature}UseCase.Params, Unit>(dispatchers.io) {

    override suspend fun execute(params: Params) {
        load{Feature}UseCase(params.{feature}Id).getOrThrow()
        save{Feature}UseCase(Save{Feature}UseCase.Params(params.{feature}Id, params.userId)).getOrThrow()
    }

    data class Params(
        val {feature}Id: {Feature}Id,
        val userId: UserId
    )
}
```

Rules:
- Never ignore the `Result` returned by another use case.
- Do not call `.fold` only to re-wrap the same success or failure.

---

## Consuming From ViewModel

```kotlin
@HiltViewModel
class {Feature}ViewModel @Inject constructor(
    private val load{Feature}UseCase: Load{Feature}UseCase,
    private val {feature}EntityFlowUseCase: {Feature}EntityFlowUseCase
): CourierViewModel<{Feature}Intent, {Feature}Model, {Feature}Event>({Feature}Model()) {

    override fun dispatch(intent: {Feature}Intent) {
        when (intent) {
            is {Feature}Intent.Collect{Feature} -> {
                launch {
                    {feature}EntityFlowUseCase(intent.{feature}Id).collectLatest { entity ->
                        reduce { it.copy(entity = entity) }
                    }
                }
            }
            is {Feature}Intent.Load{Feature} -> {
                launch {
                    load{Feature}UseCase(intent.{feature}Id).getOrThrow()
                }
            }
        }
    }
}
```

Rules:
- Inject concrete use cases, not repositories, interactors, or aggregate facades.
- Use separate `Collect...` and `Load...` intents when Room data is refreshed from network.
- Call one-shot use cases with `.getOrThrow()` inside `launch { ... }`.
- Handle domain, Room, and network exceptions in the ViewModel `catch` function.

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
    fun selectFlow(id: String): Flow<{Feature}Entity>

    @Query("SELECT * FROM {featureTable} WHERE id = :id")
    suspend fun select(id: String): {Feature}Entity

    @Upsert
    suspend fun upsert(entity: {Feature}Entity)
}
```

Rules:
- Use `@get:Query` with `val` for Room Flow accessors that have no parameters.
- Use `fun` when a Flow query has parameters.
- Place all regular `fun` methods before any `suspend fun` methods.
- Use `@Upsert` instead of separate `@Insert` / `@Update`.
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

Rules:
- When changing Room database tables or entities, increment `AppDatabase.DATABASE_VERSION`.
- Keep each model in its own file.

---

## Network Models

```kotlin
@Serializable
data class {Feature}Request(
    @SerialName("id") val id: String
)

@Serializable
data class {Feature}Response(
    @SerialName("id") val id: String,
    @SerialName("name") val name: String
)
```

Rules:
- Request model class names end with `Request`.
- Response model class names end with `Response`.
- Every request and response model is annotated with `@Serializable`.
- Every request and response field has `@SerialName`.
- Each API model annotated with `@Serializable` and `@SerialName` lives in its own file.
