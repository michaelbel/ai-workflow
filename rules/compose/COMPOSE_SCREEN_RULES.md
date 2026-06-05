# Compose Screen Rules

- Public `{Feature}Screen(viewModel = hiltViewModel())` collects state, creates remembered event helpers, observes events, and delegates UI to private `{Feature}ScreenContent`.
- `*ScreenContent` receives `state`, `dispatch`, and any remembered UI helpers needed for previews.
- `*ScreenContent` and child components must not contain business logic or domain decisions; expose derived UI flags/text/actions from the ViewModel model and render them directly.
- Collect state with `collectAsStateWithLifecycle()`.
- Observe one-time events with `ObserveAsEvents`.
- Snackbars use `SnackbarHostState`; dismiss `currentSnackbarData` before showing a new snackbar.
- Declare simple shapes inline, for example `RoundedCornerShape(8.dp)`, instead of extracting them into feature-level `private val` variables.
- Add new colors to the project UI kit colors and consume them through `MaterialTheme.colorScheme`; do not keep raw `Color(0x...)` constants in feature files.
