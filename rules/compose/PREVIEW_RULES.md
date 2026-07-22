# Preview Rules

- Always annotate previews with `@PreviewWrapper(ThemeWrapper::class)`.
- Previews must call the private `*Content` composable, not the public `*Screen` composable that accepts a ViewModel.
- Composable components must have only one preview function; represent all preview variants through a `PreviewParameterProvider`.
- When a component or screen has multiple meaningful visual states, use a `PreviewParameterProvider` and a single preview function with `@PreviewParameter`; do not write multiple separate preview functions for different states.
- When a component uses a `{Component}State` data class because it has more than one field, always create a matching private `PreviewParameterProvider` for that state in the same file.
- When a component conditionally renders parts of its UI based on computed properties of `{Component}State`, the matching `PreviewParameterProvider` must include one value per meaningful visibility combination, so every conditional branch is represented in the preview instead of only the default/first state.
- Use `BooleanProvider` for boolean-parameterized previews.
- `PreviewParameterProvider` classes are private and declared at the bottom of the file.
- Build preview and `PreviewParameterProvider` values through `Empty.copy(...)` when the model exposes an `Empty` instance; do not construct them with a full explicit constructor call.
- In `Empty.copy(...)` calls for previews, set only the fields the component actually reads/renders; do not add unrelated fields "for realism."
