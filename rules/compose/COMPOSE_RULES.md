# Compose Rules

- Do not introduce local abstractions, helper models, or extracted functions only to eliminate small UI duplication; prefer straightforward duplicated code until there is clear repeated behavior worth abstracting.
- For composable calls with named arguments, prefer multiline formatting over single-line calls; for example, write `Row(` on one line and place `verticalAlignment = ...` on the following line instead of `Row(verticalAlignment = ...)`. Do not write `Box(modifier = Modifier.fillMaxSize()) {`; write `Box(` with `modifier = Modifier.fillMaxSize()` on the next line instead.
- Add new colors through `MaterialTheme.colorScheme`; do not use raw `Color` constants for theme colors inside components.
- Use `MaterialTheme.colorScheme` for component colors.
- Use `MaterialTheme.typography` for component text styles; do not instantiate `TextStyle` directly inside components.
- For composable function calls, order arguments the same way as they are declared in the SDK/component signature.
- For `padding(...)`, order named parameters the same way as in the method signature: `start`, `top`, `end`, `bottom`.
- For `Modifier.offset(...)` backed by state, use the lambda overload: `Modifier.offset { ... }`.
- In Compose containers, separate sibling composable calls with a blank line.
- For each shared UI component, create a separate file; do not declare multiple component composables in one file.
- Create new shared UI components in `shared/ui/components`; when needed, group them into dedicated subfolders there.
