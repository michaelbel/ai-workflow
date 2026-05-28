# Dialog Rules

- Use `BasicAlertDialog` instead of `AlertDialog`; apply `clip` and `background` on the `BasicAlertDialog` modifier directly.
- Always set `modifier = Modifier.fillMaxWidth().wrapContentHeight().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceContainerHigh)` on `BasicAlertDialog`.
- Wrap scrollable content in a `Column` with `weight(1F, fill = false)` and `verticalScroll(rememberScrollState())` to handle long text without clipping.
- Place action buttons in `FlowRow` with `horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)` and `verticalArrangement = Arrangement.spacedBy(8.dp)`.
- In the confirm button lambda, call `onConfirmRequest()` before `onDismissRequest()`.
- Outer `Column` uses `verticalArrangement = Arrangement.spacedBy(40.dp)` between the content column and the button row.
