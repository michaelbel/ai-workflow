# MVI Rules

- Do not place classes or constants inside MVI classes; declare them at file level or in dedicated files/packages.
- Do not create or store variables in ViewModel classes; keep them in Model classes.
- Place business logic, branching, and decision functions in the ViewModel; composable screens and components must receive already prepared UI state and dispatch intents only.
- When creating a new screen, always create its ViewModel, Model, and Intent files immediately; do not create standalone screen composables without the matching MVI classes.
- For screen models backed by local collections, avoid storing or updating `isLoading` when loading can be derived from the collection state; treat the screen as loading when the backing collection is empty.
- For screen data backed by Room and refreshed from network, use separate `Collect...` and `Load...` intents: `Collect...` reads Room data, `Load...` performs the network request and saves the result to Room.
