---
name: new-screen
---

# Новый экран

Создаёт MVI-экран фичи проекта. Замени `{feature}` на папку фичи в snake_case, `{Feature}` на имя фичи в PascalCase, а `{package}` на целевой пакет.

Файлы:
- `features/{feature}/{Feature}Screen.kt`
- `features/{feature}/{Feature}ViewModel.kt`
- `features/{feature}/model/{Feature}Model.kt`
- `features/{feature}/intent/{Feature}Intent.kt`
- optional `features/{feature}/event/{Feature}Event.kt`
- optional `features/{feature}/navigation/{Feature}Route.kt`

---

## {Feature}Intent.kt

```kotlin
package {package}.features.{feature}.intent

import ru.mercury.courier.shared.mvi.Intent

sealed interface {Feature}Intent: Intent {
    data object LoadData: {Feature}Intent
}
```

Правила:
- Все записи `data object` идут перед любыми записями `data class`.
- Каждый intent представляет одно действие пользователя или событие жизненного цикла.

---

## {Feature}Model.kt

```kotlin
package {package}.features.{feature}.model

import ru.mercury.courier.shared.mvi.Model

data class {Feature}Model(
    val isLoading: Boolean = true
): Model
```

Правила:
- Всё UI-состояние хранится здесь; никакое состояние не хранится в ViewModel.
- Опускай `isLoading`, когда загрузку можно вывести из пустоты коллекции.

---

## {Feature}Event.kt

```kotlin
package {package}.features.{feature}.event

import ru.mercury.courier.shared.mvi.Event

sealed interface {Feature}Event: Event {
    data object BackClick: {Feature}Event
}
```

Правила:
- Используй события только для одноразовых побочных эффектов, таких как навигация, snackbar и диалоги.
- Все записи `data object` идут перед любыми записями `data class`.

---

## {Feature}ViewModel.kt

```kotlin
package {package}.features.{feature}

import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch
import ru.mercury.courier.features.{feature}.event.{Feature}Event
import ru.mercury.courier.features.{feature}.intent.{Feature}Intent
import ru.mercury.courier.features.{feature}.model.{Feature}Model
import ru.mercury.courier.shared.domain.usecase.Load{Feature}UseCase
import ru.mercury.courier.shared.mvi.CourierViewModel

@HiltViewModel
class {Feature}ViewModel @Inject constructor(
    private val load{Feature}UseCase: Load{Feature}UseCase
): CourierViewModel<{Feature}Intent, {Feature}Model, {Feature}Event>({Feature}Model()) {

    init {
        dispatch({Feature}Intent.LoadData)
    }

    override fun dispatch(intent: {Feature}Intent) {
        when (intent) {
            is {Feature}Intent.LoadData -> loadData()
        }
    }

    private fun loadData() {
        viewModelScope.launch {
            load{Feature}UseCase(Unit).getOrThrow()
            reduce { it.copy(isLoading = false) }
        }
    }
}
```

Правила:
- Используй `@HiltViewModel` и инъекцию через конструктор.
- Наследуйся от общего базового MVI ViewModel проекта с `{Feature}Intent`, `{Feature}Model` и `{Feature}Event`.
- Никаких сохранённых переменных; всё состояние живёт в Model и меняется только через `reduce { it.copy(...) }`.
- `dispatch` должен быть `when` по всем веткам intent без `else`.
- Отправляй одноразовые события через `send(...)`.
- Приватные функции-обработчики используют `viewModelScope.launch { }` для асинхронной работы.
- Внедряй конкретные классы `UseCase` / `FlowUseCase`, нужные экрану; не внедряй репозитории, интеракторы или агрегирующие фасады.
- Вызывай одноразовые use case через `.getOrThrow()` и обрабатывай выброшенные исключения в функции `catch` ViewModel.

---

## {Feature}Screen.kt

```kotlin
package {package}.features.{feature}

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.mercury.courier.features.{feature}.event.{Feature}Event
import ru.mercury.courier.features.{feature}.intent.{Feature}Intent
import ru.mercury.courier.features.{feature}.model.{Feature}Model
import ru.mercury.courier.shared.ui.preview.wrapper.ThemeWrapper
import ru.mercury.courier.shared.ui.utils.ObserveAsEvents

@Composable
fun {Feature}Screen(
    viewModel: {Feature}ViewModel = hiltViewModel()
) {
    val state by viewModel.stateFlow.collectAsStateWithLifecycle()

    {Feature}ScreenContent(
        state = state,
        dispatch = viewModel::dispatch
    )

    ObserveAsEvents(
        flow = viewModel.eventFlow
    ) { event ->
        when (event) {
            is {Feature}Event.BackClick -> Unit
        }
    }
}

@Composable
private fun {Feature}ScreenContent(
    state: {Feature}Model,
    dispatch: ({Feature}Intent) -> Unit
) {
    // content
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}ScreenContentPreview(
    @PreviewParameter({Feature}ModelPreviewParameterProvider::class) state: {Feature}Model
) {
    {Feature}ScreenContent(
        state = state,
        dispatch = {}
    )
}

private class {Feature}ModelPreviewParameterProvider: PreviewParameterProvider<{Feature}Model> {
    override val values: Sequence<{Feature}Model> = sequenceOf(
        {Feature}Model(isLoading = true),
        {Feature}Model(isLoading = false)
    )
}
```

Правила:
- Публичный `{Feature}Screen(viewModel = hiltViewModel())` только собирает state, наблюдает события и делегирует UI приватному `{Feature}ScreenContent`.
- Собирай state через `collectAsStateWithLifecycle()`.
- Наблюдай одноразовые события через `ObserveAsEvents`.
- Делай preview для `{Feature}ScreenContent`, а не для публичного экрана.
- Используй `@PreviewWrapper(ThemeWrapper::class)` и приватный `PreviewParameterProvider`.
- Применяй `innerPadding` из `Scaffold` через `contentPadding` для списков или `Modifier.padding` для одиночного содержимого.
- Добавляй `@file:OptIn(...)` вверху, когда используются экспериментальные API.
