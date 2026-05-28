---
name: new-shared-component
---

# New Shared Component

Creates a reusable shared UI component with a State holder, preview, and PreviewParameterProvider. Replace `{Component}` with the component name (e.g. `PaymentBox`, `LoyaltyCardBox`) and `{package}` with the target package.

One file per component. Place it in `shared/ui/components` or a dedicated subfolder there.

---

## {Component}.kt

```kotlin
package {package}

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper

data class {Component}State(
    val title: String,
    val onClick: () -> Unit
)

@Composable
fun {Component}(
    state: {Component}State,
    modifier: Modifier = Modifier
) {
    // component content
}

@PreviewWrapper(ThemeWrapper::class)
@FontScalePreviews
@Composable
private fun {Component}Preview(
    @PreviewParameter({Component}StateProvider::class) state: {Component}State
) {
    {Component}(state = state)
}

private class {Component}StateProvider: PreviewParameterProvider<{Component}State> {
    override val values: Sequence<{Component}State> = sequenceOf(
        {Component}State(
            title = "Example",
            onClick = {}
        )
    )
}
```

Rules:
- State is a `data class` named `{Component}State`; it holds all data and callbacks the component needs.
- The component composable takes `state` as the first parameter, `modifier` as the second with a default of `Modifier`.
- The preview calls the component directly — never the ViewModel or screen.
- Use `@PreviewWrapper(ThemeWrapper::class) @FontScalePreviews` for previews.
- Use `PreviewParameterProvider` when the component has meaningful visual states to compare; omit it for trivial single-state components.
- Each component lives in its own file; do not declare multiple components in one file.
