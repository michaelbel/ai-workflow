# MVI Rules

- Feature screens live under `features/{feature}` and are split into `{Feature}Screen.kt`, `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, `intent/{Feature}Intent.kt`, optional `event/{Feature}Event.kt`, and optional `navigation/{Feature}Route.kt`.
- Every new feature screen must include `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, and `intent/{Feature}Intent.kt` from the start, even when the initial screen state and intents are minimal.
- `ViewModel` classes use `@HiltViewModel`, constructor injection, and extend the project's shared MVI ViewModel base.
- Do not place constants or extension functions in MVI `ViewModel`, `Screen`, `Intent`, `Model`, `Event`, or `Route` files/classes; move them to dedicated non-MVI files/packages.
- Do not place helper classes inside MVI classes; declare them at file level or in dedicated files/packages.
- Do not create or store variables in ViewModel classes; keep them in Model classes.
- For data backed by Room, store and pass the Room `Entity` class directly in feature `Model` classes and composable components; do not map it to a UI model or another intermediate class.
- Place business logic, branching, and decision functions in the ViewModel; composable screens and components must receive already prepared UI state and dispatch intents only.
- `ViewModel` classes contain screen business logic, including `if`/`else`, `when`, and helper functions that choose what should happen; screens and components only render state and dispatch intents.
- When creating a new screen, always create its ViewModel, Model, and Intent files immediately; do not create standalone screen composables without the matching MVI classes.
- `dispatch` is a `when` over all intent branches with no `else`; state changes only through `reduce { it.copy(...) }`.
- One-time actions use `send({Feature}Event...)` from the ViewModel and `ObserveAsEvents` in the screen.
- `Intent`, `Model`, and `Event` types implement the project's shared MVI marker interfaces.
- For screen models backed by local collections, avoid storing or updating `isLoading` when loading can be derived from the collection state; treat the screen as loading when the backing collection is empty.
- For screen data backed by Room and refreshed from network, use separate `Collect...` and `Load...` intents: `Collect...` reads Room data, `Load...` performs the network request and saves the result to Room.
- ViewModels inject concrete `UseCase` / `FlowUseCase` classes needed by the screen; do not inject repositories, interactors, or aggregate domain facades.
- Call one-shot use cases inside `launch { ... }` with `.getOrThrow()` and handle thrown exceptions in the ViewModel `catch` function.
