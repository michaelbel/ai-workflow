# Resource Rules

- UI strings are referenced through the project's string facade, not direct `R.string` or `R.plurals` usages in UI code.
- Do not hardcode user-facing strings directly in Kotlin or XML UI code; add them to `strings.xml` and reference them through the project's string facade.
- When adding a string resource, add it to `strings.xml` and expose it through the project's string facade.
- For uppercase UI text, add a dedicated uppercase resource and string-facade entry; do not call `uppercase()` or `uppercase(Locale...)` in UI, model, or mapper code.
