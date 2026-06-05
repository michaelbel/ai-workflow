# Bottom Sheet Rules

- Feature bottom sheet packages under `features` use the `_sheet` postfix, for example `features/profile_sheet`.
- Use file-level `@file:OptIn(ExperimentalMaterial3Api::class)` when the file uses Material3 bottom sheet APIs.
- Create `sheetState` with `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- When a button closes the sheet, call `sheetState.hide()` inside `scope.launch` before dispatching the confirm or dismiss intent.
- Preview the composable that renders `SharedModalBottomSheet` or `ModalBottomSheet` itself; wrap it in `Box(modifier = Modifier.fillMaxSize())`, otherwise the bottom sheet preview may not render.
