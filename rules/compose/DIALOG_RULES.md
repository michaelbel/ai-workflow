# Dialog Rules

- Use `AlertDialog` when the dialog has action buttons; use `BasicAlertDialog` when the dialog has no action buttons.
- For `AlertDialog`, pass an `icon` slot when an icon is needed; set `modifier = Modifier.size(...)` on the `Icon`.
- For `AlertDialog`, pass a `title` slot when the dialog has a title.
- For `AlertDialog`, pass the dialog body through the `text` slot.
- For `AlertDialog`, set `iconContentColor`, `titleContentColor`, and `textContentColor` when custom content colors are needed.
- For `BasicAlertDialog`, apply `clip` and `background` on the modifier directly.
- Always set `modifier = Modifier.fillMaxWidth().wrapContentHeight().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceContainerHigh)` on `BasicAlertDialog`.
- Preview dialog composables inside `Box(modifier = Modifier.fillMaxSize())`; otherwise `AlertDialog`/`BasicAlertDialog` previews may not render.
- Wrap scrollable content in a `Column` with `weight(1F, fill = false)` and `verticalScroll(rememberScrollState())` to handle long text without clipping.
- Place action buttons in `FlowRow` with `horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)` and `verticalArrangement = Arrangement.spacedBy(8.dp)`.
- In the confirm button lambda, call `onConfirmRequest()` before `onDismissRequest()`.
- Outer `Column` uses `verticalArrangement = Arrangement.spacedBy(40.dp)` between the content column and the button row.
