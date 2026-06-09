# Kotlin Rules

- Prefer `when` instead of `if / else if` chains when expressing branching logic.
- When returning one of two branches, prefer `return when { ... }` over `return if (...) ... else ...`.
- In `when` branches, use the single-line form without braces only when the whole branch fits on one line: `condition -> statement`; if the branch body is multiline, wrap it in braces even when it contains only one statement.
- In `sealed interface` and `sealed class`, declare all `data object` entries before any `data class` entries.
- In `sealed interface`, keep short `data class` declarations with parameters on a single line: `data class Example(val param: Int) : ExampleInterface`.
- If a `sealed class` has no constructor parameters and all its members are `object` or `data object`, use a `sealed interface` instead.
- Add imports in the imports section instead of using fully qualified names inline; for example, prefer `import androidx.compose.ui.graphics.Color` with `containerColor = Color.Transparent` over `containerColor = androidx.compose.ui.graphics.Color.Transparent`.
- Do not write whitespace before `:` in class inheritance or delegation declarations; write `class Foo: Bar`, not `class Foo : Bar`.
- Always write functions with `{}` and `return`; never use `=` for the function body.
- Do not use the `internal` visibility modifier.
- Do not extract local helper functions just to remove a few repeated lines; prefer straightforward code over premature abstraction.
- Each file should contain at most one API model annotated with both `@Serializable` and `@SerialName`; move additional models to separate files.
- Use `lastIndex` instead of `size - 1` or `size.minus(1)` when referencing the last index of a collection.
- Place experimental opt-in annotations only at file level, for example `@file:OptIn(ExperimentalMaterial3Api::class)`, not on individual declarations.
- If a `companion object` and all its constants are used only within the same file, declare both the `companion object` and each constant as `private`: `private companion object { private const val LIMIT = 10 }`.
