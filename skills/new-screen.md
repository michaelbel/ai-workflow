---
name: new-screen
---

# New Screen

Creates a new MVI feature screen. Replace `{Feature}` with the actual screen name (e.g. `Profile`, `Settings`, `OrderList`) and `{package}` with the target package.

Five files must be created for every new screen:

---

## {Feature}Intent.kt

```kotlin
package {package}

import org.michaelbel.mvi.mvi.Intent

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
package {package}

import org.michaelbel.mvi.mvi.Model

data class {Feature}Model(
    val isLoading: Boolean = true
): Model
```

Rules:
- All UI state lives here; no state is stored in the ViewModel.
- Omit `isLoading` if loading can be derived from a collection being empty.

---

## {Feature}Events.kt

```kotlin
package {package}

import org.michaelbel.mvi.mvi.Event

sealed interface {Feature}Events: Event {
    data class ShowToast(val message: String): {Feature}Events
}
```

Rules:
- Use events only for one-time side effects (navigation, toasts, dialogs).
- All `data object` entries come before any `data class` entries.

---

## {Feature}ViewModel.kt

```kotlin
package {package}

import kotlinx.coroutines.launch
import org.michaelbel.mvi.mvi.MviViewModel

class {Feature}ViewModel: MviViewModel<{Feature}Intent, {Feature}Model, {Feature}Events>({Feature}Model()) {

    init {
        dispatch({Feature}Intent.LoadData)
    }

    override fun dispatch(intent: {Feature}Intent) {
        when (intent) {
            is {Feature}Intent.LoadData -> load()
        }
    }

    private fun load() {
        launch {
            reduce { it.copy(isLoading = false) }
        }
    }
}
```

Rules:
- No stored variables — all state lives in the Model via `reduce { }`.
- Use `reduce { }` to update state and `push(event)` to emit one-time events.
- `dispatch` must be a `when` over all intent branches with no `else`.
- Private handler functions use `launch { }` for async work.
- Override `catch(throwable)` to handle errors from launched coroutines.

---

## {Feature}Screen.kt

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import org.michaelbel.mvi.mvi.ObserveAsEvents

@Composable
fun {Feature}Screen(
    viewModel: {Feature}ViewModel = viewModel()
) {
    val state by viewModel.stateFlow.collectAsStateWithLifecycle()

    ObserveAsEvents(
        flow = viewModel.eventFlow
    ) { event ->
        when (event) {
            is {Feature}Events.ShowToast -> { }
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "{Feature}"
                    )
                }
            )
        }
    ) { innerPadding ->
        Text(
            modifier = Modifier.padding(innerPadding),
            text = if (state.isLoading) "Loading…" else "Content"
        )
    }
}

@Preview
@Composable
private fun {Feature}ScreenPreview() {
    {Feature}Screen()
}
```

Rules:
- Collect state with `collectAsStateWithLifecycle()`.
- Observe one-time events with `ObserveAsEvents`.
- Apply `innerPadding` from `Scaffold` via `contentPadding` on lists or `Modifier.padding` on single content.
- Always add a `@Preview` composable.
- `@file:OptIn` at the top if any experimental APIs are used.
