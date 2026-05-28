# Kotlin Rules

- Prefer `when` instead of `if / else if` chains when expressing branching logic.
- When returning one of two branches, prefer `return when { ... }` over `return if (...) ... else ...`.
- In `when` branches, use the single-line form without braces only when the whole branch fits on one line: `condition -> statement`; if the branch body is multiline, wrap it in braces even when it contains only one statement.
- In `sealed interface` and `sealed class`, declare all `data object` entries before any `data class` entries.
- In `sealed interface`, keep short `data class` declarations with parameters on a single line: `data class Example(val param: Int) : ExampleInterface`.
- Add imports in the imports section instead of using fully qualified names inline; for example, prefer `import androidx.compose.ui.graphics.Color` with `containerColor = Color.Transparent` over `containerColor = androidx.compose.ui.graphics.Color.Transparent`.
- Always write functions with `{}` and `return`; never use `=` for the function body.
- Do not use the `internal` visibility modifier.
- Do not extract local helper functions just to remove a few repeated lines; prefer straightforward code over premature abstraction.
- Place experimental opt-in annotations only at file level, for example `@file:OptIn(ExperimentalMaterial3Api::class)`, not on individual declarations.
