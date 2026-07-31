---
name: new-data-layer
---

# Новый слой данных

Создаёт или расширяет поток данных/domain проекта для фичи с использованием `UseCase` и `FlowUseCase`. Замени `{Feature}` на имя domain, `{feature}` на имя в lower camel case, `{featureTable}` на имя таблицы Room, а `{package}` на целевой пакет.

Этот скилл охватывает DAO, entity, мапперы, модели запроса/ответа, одноразовые use case и flow use case. Новая работа с данными не создаёт слои Repository или Interactor.

Обычно создаваемые или изменяемые файлы:
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

## Одноразовый UseCase с одним параметром

Используй это для suspend-операций Room/Ktor/DataStore, возвращающих один результат.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

package {package}.usecase

import androidx.room.withTransaction
import javax.inject.Inject
import {package}.shared.coroutines.SharedDispatchers
import {package}.shared.data.{Feature}Id
import {package}.shared.data.error.{Feature}Exception
import {package}.shared.data.network.NetworkService
import {package}.shared.data.network.request.{Feature}Request
import {package}.shared.data.persistence.database.AppDatabase
import {package}.shared.data.persistence.database.dao.{Feature}Dao
import {package}.shared.domain.mapper.entity
import {package}.shared.domain.mapper.handleResponse
import {package}.shared.domain.usecase.UseCase

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

Правила:
- Добавляй `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")`, когда единственный аргумент `params` переименован в семантическое имя.
- Передавай `dispatchers.io` для работы с Room и Ktor.
- Не возвращай `Result`; `UseCase` сам оборачивает `execute` в `Result`.
- Выбрасывай domain-специфичное исключение из `onFailure`.
- Создавай `val request = ...` перед вызовом `networkService`.

---

## Одноразовый UseCase с Params

Используй вложенный `data class Params`, когда есть два и более входных значения.

```kotlin
package {package}.usecase

import javax.inject.Inject
import {package}.shared.coroutines.SharedDispatchers
import {package}.shared.data.{Feature}Id
import {package}.shared.data.UserId
import {package}.shared.data.persistence.database.dao.{Feature}Dao
import {package}.shared.domain.usecase.UseCase

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

Правила:
- Держи `Params` вложенным внутри use case.
- Не используй `Pair`, `Triple`, map-ы или несколько аргументов `invoke`.
- Создавай params в месте вызова через `{Feature}UseCase.Params(...)`.

---

## FlowUseCase

Используй это для Room Flow или других наблюдаемых потоков.

```kotlin
@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")

package {package}.usecase

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import {package}.shared.coroutines.SharedDispatchers
import {package}.shared.data.{Feature}Id
import {package}.shared.data.persistence.database.dao.{Feature}Dao
import {package}.shared.data.persistence.database.entity.{Feature}Entity
import {package}.shared.domain.usecase.FlowUseCase

class {Feature}EntityFlowUseCase @Inject constructor(
    private val {feature}Dao: {Feature}Dao,
    dispatchers: SharedDispatchers
): FlowUseCase<{Feature}Id, {Feature}Entity>(dispatchers.io) {

    override fun execute({feature}Id: {Feature}Id): Flow<{Feature}Entity> {
        return {feature}Dao.selectFlow({feature}Id)
    }
}
```

Правила:
- `execute` не является `suspend`.
- Возвращай Flow из DAO напрямую.
- Не вызывай `flowOn`; базовый `FlowUseCase` применяет его сам.
- Не оборачивай значения Flow в `Result`.
- Если у flow два и более входных значения, используй вложенный `Params` точно так же, как в одноразовых use case.

---

## Значения результата сети

Используй `handleResponseResult(...).getOrThrow()`, когда сетевой ответ нужен как значение перед продолжением.

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

Правила:
- Не возвращай `handleResponseResult` из `execute`.
- Не оборачивай результат в `Result.success` / `Result.failure`.
- Позволяй `.getOrThrow()` распространять ошибки в базовый `UseCase`.

---

## Композиция UseCase

Когда один use case вызывает другой, разворачивай результат через `getOrThrow()`, чтобы родительский use case падал согласованно.

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

Правила:
- Никогда не игнорируй `Result`, возвращаемый другим use case.
- Не вызывай `.fold` только ради повторного оборачивания того же успеха или ошибки.

---

## Использование из ViewModel

```kotlin
@HiltViewModel
class {Feature}ViewModel @Inject constructor(
    private val load{Feature}UseCase: Load{Feature}UseCase,
    private val {feature}EntityFlowUseCase: {Feature}EntityFlowUseCase
): BaseViewModel<{Feature}Intent, {Feature}Model, {Feature}Event>({Feature}Model()) {

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

Правила:
- Внедряй конкретные use case, а не репозитории, интеракторы или агрегирующие фасады.
- Используй отдельные intent-ы `Collect...` и `Load...`, когда данные Room обновляются из сети.
- Вызывай одноразовые use case через `.getOrThrow()` внутри `launch { ... }`.
- Обрабатывай domain-, Room- и сетевые исключения в функции `catch` ViewModel.

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

Правила:
- Используй `@get:Query` с `val` для Room Flow-аксессоров без параметров.
- Используй `fun`, когда у Flow-запроса есть параметры.
- Размещай все обычные методы `fun` перед любыми методами `suspend fun`.
- Используй `@Upsert` вместо отдельных `@Insert` / `@Update`.
- Помечай методы, возвращающие типы Pojo, аннотацией `@Transaction`.

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

Правила:
- При изменении таблиц или entity базы данных Room увеличивай `AppDatabase.DATABASE_VERSION`.
- Держи каждую модель в отдельном файле.

---

## Модели сети

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

Правила:
- Имена классов моделей запросов заканчиваются на `Request`.
- Имена классов моделей ответов заканчиваются на `Response`.
- Каждая модель запроса и ответа аннотирована `@Serializable`.
- Каждое поле запроса и ответа имеет `@SerialName`.
- Каждая API-модель, аннотированная `@Serializable` и `@SerialName`, находится в отдельном файле.
