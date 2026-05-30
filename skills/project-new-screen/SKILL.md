---
name: project-new-screen
---

# Project New Screen

Creates a project MVI feature screen. Replace `{feature}` with the snake_case feature folder and `{Feature}` with the PascalCase feature name.

Files:
- `app/src/main/kotlin/{package}/features/{feature}/{Feature}Screen.kt`
- `app/src/main/kotlin/{package}/features/{feature}/{Feature}ViewModel.kt`
- `app/src/main/kotlin/{package}/features/{feature}/model/{Feature}Model.kt`
- `app/src/main/kotlin/{package}/features/{feature}/intent/{Feature}Intent.kt`
- `app/src/main/kotlin/{package}/features/{feature}/event/{Feature}Event.kt`
- `app/src/main/kotlin/{package}/features/{feature}/navigation/{Feature}Route.kt`

Rules:
- Use `@HiltViewModel` and constructor injection.
- Extend the project's shared MVI ViewModel base with `{Feature}Intent`, `{Feature}Model`, and `{Feature}Event`.
- Public `{Feature}Screen(viewModel = hiltViewModel())` only collects state, observes events, and delegates to private `{Feature}ScreenContent`.
- State is updated only with `reduce { it.copy(...) }`.
- Events are sent with `send(...)` and observed with `ObserveAsEvents`.
- Preview `{Feature}ScreenContent` with `@PreviewWrapper(ThemeWrapper::class)` and a private `PreviewParameterProvider`.

Minimal shape:

```kotlin
@HiltViewModel
class {Feature}ViewModel @Inject constructor(
    private val interactor: Interactor
): ProjectViewModel<{Feature}Intent, {Feature}Model, {Feature}Event>({Feature}Model()) {

    override fun dispatch(intent: {Feature}Intent) {
        when (intent) {
            is {Feature}Intent.LoadData -> launch { }
        }
    }
}
```

```kotlin
@Composable
fun {Feature}Screen(
    viewModel: {Feature}ViewModel = hiltViewModel()
) {
    val state by viewModel.stateFlow.collectAsStateWithLifecycle()

    {Feature}ScreenContent(
        state = state,
        dispatch = viewModel::dispatch
    )

    ObserveAsEvents(flow = viewModel.eventFlow) { event ->
        when (event) {
            is {Feature}Event.SnackbarMessage -> { }
        }
    }
}
```
