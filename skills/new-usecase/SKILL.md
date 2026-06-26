---
name: new-usecase
---

# New UseCase

Creates a single `UseCase` or `FlowUseCase` in `shared/domain/usecase`.

## Choose The Base Class

- Use `UseCase<P, R>` for one-shot suspend operations.
- Use `FlowUseCase<P, R>` for observable streams.
- Do not create Repository or Interactor wrappers for new work.

## Constructor Dependencies

Inject concrete dependencies directly:
- `NetworkService` for Ktor calls.
- `AppDatabase` when a Room transaction is needed.
- DAO classes for Room reads/writes.
- DataStore classes for persisted settings.
- Other use cases when composing behavior.
- `SharedDispatchers` as a non-`private` parameter passed to the base class.

## Parameters

- No input: use `Unit` and keep `execute(params: Unit)`.
- One input: use the domain type as `P`, rename the override parameter, and add `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")`.
- Two or more inputs: add nested `data class Params(...)` and use it as `P`.

## One-Shot Template

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class LoadThingUseCase @Inject constructor(
    private val networkService: NetworkService,
    private val thingDao: ThingDao,
    dispatchers: SharedDispatchers
): UseCase<ThingId, Unit>(dispatchers.io) {

    override suspend fun execute(thingId: ThingId) {
        handleResponse(
            request = {
                val request = ThingRequest(thingId)
                networkService.loadThing(request)
            },
            onSuccess = { data ->
                thingDao.upsert(data.entity)
            },
            onFailure = { error -> throw ThingException(error.message) }
        )
    }
}
```

## Flow Template

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class ThingFlowUseCase @Inject constructor(
    private val thingDao: ThingDao,
    dispatchers: SharedDispatchers
): FlowUseCase<ThingId, ThingEntity>(dispatchers.io) {

    override fun execute(thingId: ThingId): Flow<ThingEntity> {
        return thingDao.selectFlow(thingId)
    }
}
```

## Network Value Template

Use this when the network response is needed as a value inside `execute`.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class LoadThingUseCase @Inject constructor(
    private val networkService: NetworkService,
    dispatchers: SharedDispatchers
): UseCase<ThingId, ThingEntity>(dispatchers.io) {

    override suspend fun execute(thingId: ThingId): ThingEntity {
        val data = handleResponseResult {
            val request = ThingRequest(thingId)
            networkService.loadThing(request)
        }.getOrThrow()

        return data.entity
    }
}
```

## Required Behaviors

- `UseCase.execute` returns raw `R`, not `Result<R>`.
- Throw domain-specific exceptions from failures; let the base `UseCase` convert them to `Result.failure`.
- Use `handleResponseResult(...).getOrThrow()` when a network response is consumed as a value.
- Call other use cases with `.getOrThrow()`.
- Call one-shot use cases from ViewModels with `.getOrThrow()` inside `launch { ... }`.
- Do not add `withContext` or `flowOn`; the base classes handle dispatchers.
- Create `val request = ...` before each `networkService` call.
