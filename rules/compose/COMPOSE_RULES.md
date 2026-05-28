# Compose Rules

- Do not introduce local abstractions, helper models, or extracted functions only to eliminate small UI duplication; prefer straightforward duplicated code until there is clear repeated behavior worth abstracting.
- For composable calls with named arguments, prefer multiline formatting over single-line calls; for example, write `Row(` on one line and place `verticalAlignment = ...` on the following line instead of `Row(verticalAlignment = ...)`. Do not write `Box(modifier = Modifier.fillMaxSize()) {`; write `Box(` with `modifier = Modifier.fillMaxSize()` on the next line instead.
