# Shimmer / Loading Placeholder Rules

- Use `Modifier.placeholder(visible = ..., highlight = PlaceholderHighlight.shimmer(), color = MaterialTheme.colorScheme.surfaceContainerHigh, shape = RoundedCornerShape(...))` for skeleton loading.
- Use `Spacer` for a standalone placeholder that has no child content; do not use an empty `Box` solely to render a placeholder. Use `Box` only when the placeholder must also act as a container for child composables.
- Always pass `visible = state.isLoading` (or the relevant boolean) — do not hardcode `visible = true` except inside dedicated loading composables.
- Use `MaterialTheme.colorScheme.surfaceContainerHigh` as the placeholder color; do not use raw `Color` constants.
- For an action button or a button placed in the `floatingActionButton` slot, keep the real button in the composition while loading and apply `Modifier.placeholder(visible = state.isLoading, highlight = PlaceholderHighlight.shimmer(), color = MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(...))` directly to its modifier; do not replace the button with a conditional placeholder `Spacer`.
- Match the `shape` of the placeholder to the shape of the real content it represents (e.g. `RoundedCornerShape(16.dp)` for cards, `RoundedCornerShape(8.dp)` for smaller elements).
- For full-screen or section loading states, create a dedicated loading composable (e.g. `PageLoading`, `SectionLoading`) that uses a `SharedLazyColumn` with `userScrollEnabled = false` and `Spacer` items styled with `.placeholder(visible = true, ...)`.
- In dedicated loading composables `visible` is always `true`; the caller decides when to show the composable.
- Import `PlaceholderHighlight` and `placeholder`/`shimmer` from the project's shared UI module, not from any third-party library directly.
