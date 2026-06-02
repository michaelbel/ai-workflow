# Preview Rules

- Always annotate previews with `@PreviewWrapper(ThemeWrapper::class)` and `@FontScalePreviews` (or `@FontScaleHightPreviews` for full-screen screens).
- Previews must call the private `*Content` composable, not the public `*Screen` composable that accepts a ViewModel.
- Composable components must have only one preview function; represent all preview variants through a `PreviewParameterProvider`.
- When a component or screen has multiple meaningful visual states, use a `PreviewParameterProvider` and a single preview function with `@PreviewParameter`; do not write multiple separate preview functions for different states.
- When a component uses a `{Component}State` data class because it has more than one field, always create a matching private `PreviewParameterProvider` for that state in the same file.
- Use `BooleanProvider` for boolean-parameterized previews.
- `PreviewParameterProvider` classes are private and declared at the bottom of the file.
