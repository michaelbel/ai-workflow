---
name: new-dialog
---

# New Dialog

Creates a Compose dialog. Replace `{Feature}` with the dialog purpose (e.g. `PaymentCancel`, `LoyaltyUnlink`) and `{package}` with the target package.

One file per dialog.

---

## {Feature}Dialog.kt

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package {package}

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun {Feature}Dialog(
    onDismissRequest: () -> Unit,
    onConfirmRequest: () -> Unit
) {
    BasicAlertDialog(
        onDismissRequest = onDismissRequest,
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceContainerHigh)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(40.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Column(
                modifier = Modifier
                    .weight(weight = 1F, fill = false)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = stringResource(Strings.{Feature}Title),
                    modifier = Modifier.padding(start = 24.dp, top = 24.dp, end = 24.dp),
                    style = MaterialTheme.typography.regular22.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 22.sp
                    )
                )

                Text(
                    text = stringResource(Strings.{Feature}Message),
                    modifier = Modifier.padding(horizontal = 24.dp),
                    style = MaterialTheme.typography.regular14.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 20.sp
                    )
                )
            }

            FlowRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 8.dp, end = 8.dp, bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DialogSecondaryButton(
                    text = stringResource(Strings.DialogCancel),
                    onClick = onDismissRequest
                )

                DialogPrimaryButton(
                    text = stringResource(Strings.DialogConfirm),
                    onClick = {
                        onConfirmRequest()
                        onDismissRequest()
                    }
                )
            }
        }
    }
}

@PreviewWrapper(ThemeWrapper::class)
@FontScalePreviews
@Composable
private fun {Feature}DialogPreview() {
    {Feature}Dialog(
        onDismissRequest = {},
        onConfirmRequest = {}
    )
}
```

Rules:
- Use `BasicAlertDialog`, not `AlertDialog`.
- Clip and background go on the `BasicAlertDialog` modifier, not inside.
- Content column uses `weight(1F, fill = false)` + `verticalScroll` to handle long text.
- Buttons always go in `FlowRow` with `Arrangement.spacedBy(8.dp, Alignment.End)`.
- `onConfirmRequest()` is called before `onDismissRequest()` inside the confirm button lambda.
