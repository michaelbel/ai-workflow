---
name: new-bottom-sheet
---

# New Bottom Sheet

Creates a project Compose bottom sheet. Replace `{Feature}` with the sheet purpose, `{feature}` with the lower camel-case name, and `{package}` with the target package.

Use this skill for feature bottom sheets under `features/{feature}_sheet`.

---

## {Feature}BottomSheet.kt

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.compose.ui.unit.dp
import ru.mercury.courier.shared.ui.components.SharedLazyColumn
import ru.mercury.courier.shared.ui.components.SharedModalBottomSheet
import ru.mercury.courier.shared.ui.components.system.CourierFixedText
import ru.mercury.courier.shared.ui.preview.wrapper.ThemeWrapper
import ru.mercury.courier.shared.ui.theme.CourierStrings
import ru.mercury.courier.shared.ui.theme.medium16

@Composable
fun {Feature}BottomSheet(
    state: {Feature}SheetModel,
    dispatch: ({Feature}SheetIntent) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    SharedModalBottomSheet(
        onDismissRequest = { dispatch({Feature}SheetIntent.DismissClick) },
        sheetState = sheetState
    ) {
        SharedLazyColumn(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(
                start = 16.dp,
                top = 44.dp,
                end = 16.dp,
                bottom = 16.dp
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                {Feature}Card(
                    state = {Feature}CardState(
                        model = state.item,
                        onClick = { dispatch({Feature}SheetIntent.ItemClick) }
                    )
                )
            }

            item {
                Spacer(
                    modifier = Modifier.height(0.dp)
                )
            }

            if (state.showSecondaryAction) {
                item {
                    {Feature}SecondaryButton(
                        onClick = { dispatch({Feature}SheetIntent.SecondaryActionClick) }
                    )
                }
            }

            if (state.showPrimaryAction) {
                item {
                    Button(
                        onClick = { dispatch({Feature}SheetIntent.PrimaryActionClick) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        CourierFixedText(
                            text = stringResource(CourierStrings.{Feature}PrimaryAction),
                            style = MaterialTheme.typography.medium16.copy(
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                }
            }
        }
    }
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}BottomSheetPreview(
    @PreviewParameter({Feature}SheetModelPreviewParameterProvider::class) state: {Feature}SheetModel
) {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}BottomSheet(
            state = state,
            dispatch = {}
        )
    }
}

private class {Feature}SheetModelPreviewParameterProvider: PreviewParameterProvider<{Feature}SheetModel> {
    override val values: Sequence<{Feature}SheetModel>
        get() {
            val item = {Feature}ItemModel(
                id = "sample-id",
                title = "Sample item",
                subtitle = "Sample details"
            )

            return sequenceOf(
                {Feature}SheetModel(
                    item = item,
                    showPrimaryAction = true,
                    showSecondaryAction = false
                ),
                {Feature}SheetModel(
                    item = item,
                    showPrimaryAction = false,
                    showSecondaryAction = true
                )
            )
        }
}
```

Rules:
- Use file-level `@file:OptIn(ExperimentalMaterial3Api::class)`.
- Use `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- Follow Compose Rules: use the project's `Shared*` wrapper, such as `SharedModalBottomSheet`, when it exists in the project.
- Preview the composable that renders the bottom sheet itself, not a separate private content-only composable.
- Wrap bottom sheet previews in `Box(modifier = Modifier.fillMaxSize())`; otherwise the preview may not render.
- Use anonymized sample preview data such as `sample-id`, `Sample item`, and `Sample details`.
