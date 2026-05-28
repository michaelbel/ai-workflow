# Preview Rules

- Always annotate previews with `@PreviewWrapper(ThemeWrapper::class)` and `@FontScalePreviews` (or `@FontScaleHightPreviews` for full-screen screens).
- Previews must call the private `*Content` composable, not the public `*Screen` composable that accepts a ViewModel.
- When a component or screen has multiple meaningful visual states, use a `PreviewParameterProvider` and a single preview function with `@PreviewParameter`; do not write multiple separate preview functions for different states.
- Use `BooleanProvider` for boolean-parameterized previews.
- `PreviewParameterProvider` classes are private and declared at the bottom of the file.
