# Project Bottom Sheet Rules

- Feature bottom sheet packages under `features` use the `_sheet` postfix, for example `features/filter_price_sheet`.
- Use `SharedModalBottomSheet` instead of `ModalBottomSheet` directly.
- Create `sheetState` with `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- Public `{Feature}Sheet` creates the sheet state and delegates UI to private `{Feature}SheetContent`.
- When a button closes the sheet, call `sheetState.hide()` inside `scope.launch` before dispatching the confirm or dismiss intent.
- Preview the private `{Feature}SheetContent`, not the public sheet composable.
