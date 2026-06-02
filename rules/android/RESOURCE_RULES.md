# Resource Rules

- Do not hardcode user-facing strings directly in code; always add them to `strings` resources and reference those resources from code.
- Do not call `uppercase()` or `uppercase(Locale...)` for UI strings; create the required uppercase variant in `strings` and reference it through `Strings`.
