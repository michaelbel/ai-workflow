---
name: new-usecase
---

# Новый UseCase

Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.

## Выбор базового класса

- Используй `UseCase<P, R>` для одноразовых suspend-операций.
- Используй `FlowUseCase<P, R>` для наблюдаемых потоков.
- Не создавай обёртки Repository или Interactor для новой работы.

## Зависимости конструктора

Внедряй конкретные зависимости напрямую:
- `NetworkService` для вызовов Ktor.
- `AppDatabase`, когда нужна транзакция Room.
- Классы DAO для чтения/записи Room.
- Классы DataStore для сохраняемых настроек.
- Другие use case при композиции поведения.
- `SharedDispatchers` как не-`private` параметр, передаваемый в базовый класс.

## Параметры

- Без входных данных: используй `Unit` и оставляй `execute(params: Unit)`.
- Один входной параметр: используй domain-тип как `P`, переименуй override-параметр и добавь `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")`.
- Два и более входных параметра: добавь вложенный `data class Params(...)` и используй его как `P`.

## Шаблон одноразового UseCase

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

## Шаблон Flow

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

## Шаблон значения сети

Используй это, когда сетевой ответ нужен как значение внутри `execute`.

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

## Обязательное поведение

- `UseCase.execute` возвращает сырой `R`, а не `Result<R>`.
- Выбрасывай domain-специфичные исключения при ошибках; позволяй базовому `UseCase` конвертировать их в `Result.failure`.
- Используй `handleResponseResult(...).getOrThrow()`, когда сетевой ответ потребляется как значение.
- Вызывай другие use case через `.getOrThrow()`.
- Вызывай одноразовые use case из ViewModel через `.getOrThrow()` внутри `launch { ... }`.
- Не добавляй `withContext` или `flowOn`; базовые классы сами обрабатывают диспетчеры.
- Создавай `val request = ...` перед каждым вызовом `networkService`.
