# Project MVI Rules

- Feature screens live under `features/{feature}` and are split into `{Feature}Screen.kt`, `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, `intent/{Feature}Intent.kt`, optional `event/{Feature}Event.kt`, and optional `navigation/{Feature}Route.kt`.
- `ViewModel` classes use `@HiltViewModel`, constructor injection, and extend the project's shared MVI ViewModel base.
- `dispatch` is a `when` over all intent branches with no `else`; state changes only through `reduce { it.copy(...) }`.
- One-time actions use `send({Feature}Event...)` from the ViewModel and `ObserveAsEvents` in the screen.
- `Intent`, `Model`, and `Event` types implement the project's shared MVI marker interfaces.
