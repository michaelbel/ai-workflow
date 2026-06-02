# Project MVI Rules

- Feature screens live under `features/{feature}` and are split into `{Feature}Screen.kt`, `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, `intent/{Feature}Intent.kt`, optional `event/{Feature}Event.kt`, and optional `navigation/{Feature}Route.kt`.
- Every new feature screen must include `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, and `intent/{Feature}Intent.kt` from the start, even when the initial screen state and intents are minimal.
- `ViewModel` classes use `@HiltViewModel`, constructor injection, and extend the project's shared MVI ViewModel base.
- `ViewModel` classes contain screen business logic, including `if`/`else`, `when`, and helper functions that choose what should happen; screens and components only render state and dispatch intents.
- `dispatch` is a `when` over all intent branches with no `else`; state changes only through `reduce { it.copy(...) }`.
- One-time actions use `send({Feature}Event...)` from the ViewModel and `ObserveAsEvents` in the screen.
- `Intent`, `Model`, and `Event` types implement the project's shared MVI marker interfaces.
