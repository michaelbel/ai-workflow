# Project Preview Rules

- Previews use `@PreviewWrapper(ThemeWrapper::class)`.
- For text-heavy screens and components, include `@FontScalePreviews`; use the project high-preview annotation when the component is full-screen and needs a taller viewport.
- Preview public screens through their private `*Content` composables, not through the `hiltViewModel()` entrypoint.
- Use private `PreviewParameterProvider` classes at the bottom of the file for multiple visual states.
