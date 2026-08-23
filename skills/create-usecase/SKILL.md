---
name: create-usecase
description: >-
  Use when пользователь просит добавить один `UseCase` или `FlowUseCase` в
  `shared/domain/usecase` — одну suspend-операцию или один наблюдаемый Flow — или говорит "add a use
  case", "new UseCase", "new FlowUseCase". Предполагает, что требуемые endpoint, DAO/entity и
  мапперы уже существуют. Не используй для их создания, Worker/realtime lifecycle или ViewModel;
  выбери соответствующий атомарный skill либо create-data-layer для составного потока.
metadata:
  author: michaelbel
---

# Новый UseCase

Создаёт один `UseCase` или `FlowUseCase` в `shared/domain/usecase`.

## Граница ответственности

Этот skill оформляет одну business-операцию или один наблюдаемый поток и их `Result`/dispatcher
семантику. Он не создаёт endpoint, request/response, Room entity/DAO, mapper, Worker, realtime
connection или Screen. Для reload по realtime и фоновой синхронизации use case содержит
переиспользуемую business-логику, а realtime data source или Worker только инициирует его.

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
- Один входной параметр: используй domain-тип как `P`, переименуй override-параметр и добавь
  `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")`.
- Два и более входных параметра: добавь вложенный `data class Params(...)` и используй его как `P`.

## Шаблон одноразового UseCase

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class ThingsDetailsUseCase @Inject constructor(
    private val networkService: NetworkService,
    private val thingDao: ThingDao,
    dispatchers: SharedDispatchers
): UseCase<ThingId, Unit>(dispatchers.io) {

    override suspend fun execute(thingId: ThingId) {
        handleResponse(
            request = {
                val request = ThingsDetailsRequest(thingId)
                networkService.thingsDetails(request)
            },
            onSuccess = { data ->
                thingDao.upsert(data.entity)
            },
            onFailure = { error -> throw ThingsDetailsException(error.message) }
        )
    }

    data class ThingsDetailsException(
        override val message: String
    ): AppNetworkException(message)
}
```

Замени `AppNetworkException` на базовое сетевое исключение целевого проекта. Имя use case и
вложенного исключения выводи из endpoint path или имени метода `NetworkService`, а не из intent
экрана.

## Шаблон Flow

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

class ThingEntityFlowUseCase @Inject constructor(
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

class ThingsDetailsUseCase @Inject constructor(
    private val networkService: NetworkService,
    dispatchers: SharedDispatchers
): UseCase<ThingId, ThingEntity>(dispatchers.io) {

    override suspend fun execute(thingId: ThingId): ThingEntity {
        val data = handleResponseResult {
            val request = ThingsDetailsRequest(thingId)
            networkService.thingsDetails(request)
        }.getOrElse { throwable ->
            if (throwable is CancellationException) throw throwable
            throw ThingsDetailsException(throwable.message.orEmpty())
        }

        return data.entity
    }

    data class ThingsDetailsException(
        override val message: String
    ): AppNetworkException(message)
}
```

Здесь преобразование ошибки в endpoint-specific exception является содержательной классификацией,
а не повторным оборачиванием того же `Result`. Всегда пробрасывай `CancellationException` без
преобразования.

## Обязательное поведение

- `UseCase.execute` возвращает сырой `R`, а не `Result<R>`.
- Выбрасывай domain-специфичные исключения при ошибках; позволяй базовому `UseCase` конвертировать
  их в `Result.failure`.
- Используй `handleResponseResult(...).getOrThrow()`, когда generic exception достаточно; для
  endpoint-specific exception используй `getOrElse`, пробрось `CancellationException` и выбрось
  конкретный тип.
- Вызывай другие use case через `.getOrThrow()`.
- Вызывай одноразовые use case из ViewModel через `.getOrThrow()` внутри `launch { ... }`.
- Не добавляй `withContext` или `flowOn`; базовые классы сами обрабатывают диспетчеры.
- Создавай `val request = ...` перед каждым вызовом `networkService`.
