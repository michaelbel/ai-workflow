---
name: project-new-dialog
---

# Project New Dialog

Creates a project Compose dialog.

Rules:
- Use `BasicAlertDialog`.
- Keep callbacks explicit: `onConfirmRequest` and `onDismissRequest`.
- Use the project's string facade for all text.
- Use `MaterialTheme.typography.*` project styles.
- Add a preview with `@PreviewWrapper(ThemeWrapper::class)`; include font-scale previews when text can wrap.
- Prefer project shared components when a matching `Shared*` component exists.

Minimal shape:

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

@Composable
fun {Feature}Dialog(
    onConfirmRequest: () -> Unit,
    onDismissRequest: () -> Unit
) {
    BasicAlertDialog(
        onDismissRequest = onDismissRequest,
        modifier = Modifier.fillMaxWidth().wrapContentHeight()
    ) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            // content
        }
    }
}
```
