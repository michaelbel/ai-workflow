---
name: new-bottom-sheet
---

# New Bottom Sheet

Creates a Compose `ModalBottomSheet`. Replace `{Feature}` with the sheet purpose (e.g. `Pin`, `Loyalty`) and `{package}` with the target package.

One file per bottom sheet.

---

## {Feature}BottomSheet.kt

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.constraintlayout.compose.Dimension

@Composable
fun {Feature}BottomSheet(
    state: {Feature}BottomSheetModel,
    dispatch: ({Feature}Intent) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = { dispatch({Feature}Intent.Dismiss) },
        sheetState = sheetState,
        containerColor = Color.White,
        dragHandle = { SharedDragHandle() }
    ) {
        {Feature}BottomSheetContent(
            state = state,
            dispatch = dispatch
        )
    }
}

@Composable
private fun {Feature}BottomSheetContent(
    state: {Feature}BottomSheetModel,
    dispatch: ({Feature}Intent) -> Unit
) {
    Scaffold(
        containerColor = Color.White
    ) { paddingValues ->
        ConstraintLayout(
            modifier = Modifier
                .fillMaxWidth()
                .padding(paddingValues)
        ) {
            val (titleRef, closeIconRef, contentRef, buttonRef) = createRefs()

            CourierFixedText(
                text = stringResource(Strings.{Feature}Title),
                modifier = Modifier.constrainAs(titleRef) {
                    width = Dimension.fillToConstraints
                    height = Dimension.wrapContent
                    start.linkTo(parent.start, 16.dp)
                    top.linkTo(closeIconRef.top)
                    end.linkTo(closeIconRef.start, 8.dp)
                    bottom.linkTo(closeIconRef.bottom)
                }
            )

            IconButton(
                onClick = { dispatch({Feature}Intent.Dismiss) },
                modifier = Modifier.constrainAs(closeIconRef) {
                    width = Dimension.wrapContent
                    height = Dimension.wrapContent
                    top.linkTo(parent.top)
                    end.linkTo(parent.end, 4.dp)
                }
            ) {
                Icon(
                    imageVector = Close24,
                    contentDescription = null
                )
            }

            CourierButton(
                onClick = { dispatch({Feature}Intent.Confirm) },
                text = stringResource(Strings.{Feature}Confirm),
                modifier = Modifier.constrainAs(buttonRef) {
                    width = Dimension.fillToConstraints
                    height = Dimension.wrapContent
                    start.linkTo(parent.start, 16.dp)
                    end.linkTo(parent.end, 16.dp)
                    bottom.linkTo(parent.bottom, 16.dp)
                }
            )
        }
    }
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}BottomSheetContentPreview(
    @PreviewParameter({Feature}BottomSheetModelProvider::class) state: {Feature}BottomSheetModel
) {
    {Feature}BottomSheetContent(
        state = state,
        dispatch = {}
    )
}

private class {Feature}BottomSheetModelProvider: PreviewParameterProvider<{Feature}BottomSheetModel> {
    override val values: Sequence<{Feature}BottomSheetModel> = sequenceOf(
        {Feature}BottomSheetModel()
    )
}
```

Rules:
- Always use `skipPartiallyExpanded = true`.
- `containerColor = Color.White`, `dragHandle = { SharedDragHandle() }`.
- Create `ModalBottomSheet` in `{Feature}BottomSheet`; place the sheet body in `Scaffold` inside `{Feature}BottomSheetContent`.
- Layout inside the sheet uses `ConstraintLayout`; all refs use the `Ref` postfix.
- Close button dispatches a Dismiss intent; it is placed at `top.linkTo(parent.top)`, `end.linkTo(parent.end, 4.dp)`.
- The public composable delegates to a private `*Content` composable; the preview targets the `*Content` function.
