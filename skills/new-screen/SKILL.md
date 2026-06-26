---
name: new-screen
---

# New Screen

Creates a project MVI feature screen. Replace `{feature}` with the snake_case feature folder, `{Feature}` with the PascalCase feature name, and `{package}` with the target package.

Files:
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

Rules:
- All `data object` entries come before any `data class` entries.
- Each intent represents a single user action or lifecycle event.

---

## {Feature}Model.kt

```kotlin
package {package}.features.{feature}.model

import ru.mercury.courier.shared.mvi.Model

data class {Feature}Model(
    val isLoading: Boolean = true
): Model
```

Rules:
- All UI state lives here; no state is stored in the ViewModel.
- Omit `isLoading` when loading can be derived from a collection being empty.

---

## {Feature}Event.kt

```kotlin
package {package}.features.{feature}.event

import ru.mercury.courier.shared.mvi.Event

sealed interface {Feature}Event: Event {
    data object BackClick: {Feature}Event
}
```

Rules:
- Use events only for one-time side effects such as navigation, snackbars, and dialogs.
- All `data object` entries come before any `data class` entries.

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

Rules:
- Use `@HiltViewModel` and constructor injection.
- Extend the project's shared MVI ViewModel base with `{Feature}Intent`, `{Feature}Model`, and `{Feature}Event`.
- No stored variables; all state lives in the Model and changes only through `reduce { it.copy(...) }`.
- `dispatch` must be a `when` over all intent branches with no `else`.
- Send one-time events with `send(...)`.
- Private handler functions use `viewModelScope.launch { }` for async work.
- Inject concrete `UseCase` / `FlowUseCase` classes needed by the screen; do not inject repositories, interactors, or aggregate facades.
- Call one-shot use cases with `.getOrThrow()` and handle thrown exceptions in the ViewModel `catch` function.

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

Rules:
- Public `{Feature}Screen(viewModel = hiltViewModel())` only collects state, observes events, and delegates UI to private `{Feature}ScreenContent`.
- Collect state with `collectAsStateWithLifecycle()`.
- Observe one-time events with `ObserveAsEvents`.
- Preview `{Feature}ScreenContent`, not the public screen.
- Use `@PreviewWrapper(ThemeWrapper::class)` and a private `PreviewParameterProvider`.
- Apply `innerPadding` from `Scaffold` via `contentPadding` on lists or `Modifier.padding` on single content.
- Add `@file:OptIn(...)` at the top when experimental APIs are used.
