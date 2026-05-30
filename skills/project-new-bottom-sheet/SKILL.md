---
name: project-new-bottom-sheet
---

# Project New Bottom Sheet

Creates a project feature bottom sheet.

Rules:
- If the sheet is a feature under `features`, the package folder must end with `_sheet`, for example `features/filter_price_sheet`.
- Use `SharedModalBottomSheet`, not `ModalBottomSheet` directly.
- Use `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- Public `{Feature}Sheet` creates `sheetState` and `scope`; private `{Feature}SheetContent` contains the UI.
- For confirm/dismiss buttons that close the sheet, call `sheetState.hide()` inside `scope.launch` before dispatching the intent.
- Preview `{Feature}SheetContent`, not public `{Feature}Sheet`.
- Use project `Shared*` components when they exist.

Minimal shape:

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

@Composable
fun {Feature}Sheet(
    state: {Feature}Model,
    dispatch: ({Feature}Intent) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()

    SharedModalBottomSheet(
        onDismissRequest = { dispatch({Feature}Intent.Dismiss) },
        sheetState = sheetState
    ) {
        {Feature}SheetContent(
            state = state,
            dispatch = dispatch,
            onDismissClick = {
                scope.launch {
                    sheetState.hide()
                    dispatch({Feature}Intent.Dismiss)
                }
            }
        )
    }
}
```
