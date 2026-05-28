# Kotlin Rules

- Prefer `when` instead of `if / else if` chains when expressing branching logic.
- When returning one of two branches, prefer `return when { ... }` over `return if (...) ... else ...`.
- In `when` branches, use braces when the branch body is a multiline statement or call; omit braces only when the whole branch fits on one line: `condition -> statement`.
- In `sealed interface` and `sealed class`, declare all `data object` entries before any `data class` entries.
- Add imports in the imports section instead of using fully qualified names inline; for example, prefer `import androidx.compose.ui.graphics.Color` with `containerColor = Color.Transparent` over `containerColor = androidx.compose.ui.graphics.Color.Transparent`.
