# Scaffold Rules

- Snackbars for regular messages go inside `Scaffold`'s `snackbarHost`; snackbars that must appear above the status bar (top error banners) go outside `Scaffold` in a wrapping `Box`, aligned to `Alignment.TopCenter` with `Modifier.statusBarsPadding()`.
- When two snackbars coexist inside `snackbarHost`, wrap them in a `Box` and use separate `SnackbarHostState` instances with different `containerColor` values.
- FAB always uses `floatingActionButtonPosition = FabPosition.Center`; apply horizontal padding via `Modifier.padding(horizontal = 16.dp)` on the button itself.
- Dismiss the current snackbar before showing a new one: call `hostState.currentSnackbarData?.dismiss()` before `scope.launch { hostState.showSnackbar(...) }`.
- Always wrap `Scaffold` in a `Box(modifier = Modifier.fillMaxSize())` when a top snackbar needs to be placed outside the scaffold.
