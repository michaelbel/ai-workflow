---
name: new-alert_dialog
---

# Новый Alert Dialog

Создаёт Compose-диалог проекта. Замени `{Feature}` на назначение диалога, `{feature}` на имя в lower camel case, а `{package}` на целевой пакет.

Используй `AlertDialog`, когда в диалоге есть кнопки действий. Используй `BasicAlertDialog`, когда кнопок действий нет.

---

## AlertDialog с двумя кнопками

```kotlin
package {package}

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.mercury.courier.shared.ui.preview.wrapper.ThemeWrapper
import ru.mercury.courier.shared.ui.theme.CourierStrings
import ru.mercury.courier.shared.ui.theme.medium14
import ru.mercury.courier.shared.ui.theme.onSurfaceVariant2
import ru.mercury.courier.shared.ui.theme.regular14
import ru.mercury.courier.shared.ui.theme.regular22

@Composable
fun {Feature}Dialog(
    state: {Feature}DialogModel,
    dispatch: ({Feature}DialogIntent) -> Unit
) {
    AlertDialog(
        onDismissRequest = { dispatch({Feature}DialogIntent.DismissClick) },
        confirmButton = {
            TextButton(
                onClick = {
                    dispatch({Feature}DialogIntent.ConfirmClick)
                    dispatch({Feature}DialogIntent.DismissClick)
                }
            ) {
                Text(
                    text = stringResource(CourierStrings.{Feature}Confirm),
                    style = MaterialTheme.typography.medium14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = { dispatch({Feature}DialogIntent.DismissClick) }
            ) {
                Text(
                    text = stringResource(CourierStrings.DialogCancel),
                    style = MaterialTheme.typography.regular14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                Text(
                    text = stringResource(CourierStrings.{Feature}Title),
                    style = MaterialTheme.typography.regular22.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 22.sp
                    )
                )

                Text(
                    text = stringResource(CourierStrings.{Feature}Message, state.sampleValue),
                    style = MaterialTheme.typography.regular14.copy(
                        color = MaterialTheme.colorScheme.onSurfaceVariant2,
                        lineHeight = 20.sp
                    )
                )
            }
        }
    )
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}DialogPreview() {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}Dialog(
            state = {Feature}DialogModel(
                sampleValue = "0000"
            ),
            dispatch = {}
        )
    }
}
```

---

## AlertDialog с одной кнопкой

```kotlin
@Composable
fun {Feature}StatusDialog(
    dispatch: ({Feature}DialogIntent) -> Unit
) {
    AlertDialog(
        onDismissRequest = { dispatch({Feature}DialogIntent.DismissClick) },
        confirmButton = {
            TextButton(
                onClick = { dispatch({Feature}DialogIntent.DismissClick) }
            ) {
                Text(
                    text = stringResource(CourierStrings.DialogOk),
                    style = MaterialTheme.typography.medium14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        text = {
            Text(
                text = stringResource(CourierStrings.{Feature}Message),
                style = MaterialTheme.typography.regular22.copy(
                    color = MaterialTheme.colorScheme.onBackground,
                    lineHeight = 22.sp
                )
            )
        }
    )
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}StatusDialogPreview() {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}StatusDialog(
            dispatch = {}
        )
    }
}
```

---

## BasicAlertDialog без кнопок

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.mercury.courier.shared.ui.components.system.CourierFixedText
import ru.mercury.courier.shared.ui.preview.wrapper.ThemeWrapper
import ru.mercury.courier.shared.ui.theme.CourierStrings
import ru.mercury.courier.shared.ui.theme.regular14
import ru.mercury.courier.shared.ui.theme.regular22

@Composable
fun {Feature}PickerDialog(
    state: {Feature}PickerDialogModel,
    dispatch: ({Feature}PickerDialogIntent) -> Unit
) {
    BasicAlertDialog(
        onDismissRequest = { dispatch({Feature}PickerDialogIntent.DismissClick) },
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceContainerHigh)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
            horizontalAlignment = Alignment.Start
        ) {
            CourierFixedText(
                text = stringResource(CourierStrings.{Feature}Title),
                modifier = Modifier.padding(horizontal = 24.dp),
                style = MaterialTheme.typography.regular22.copy(
                    color = MaterialTheme.colorScheme.onBackground,
                    lineHeight = 22.sp
                )
            )

            Spacer(
                modifier = Modifier.height(12.dp)
            )

            state.options.forEachIndexed { index, option ->
                ListItem(
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .clip(optionItemShape(index = index, lastIndex = state.options.lastIndex))
                        .clickable {
                            dispatch({Feature}PickerDialogIntent.OptionClick(option))
                            dispatch({Feature}PickerDialogIntent.DismissClick)
                        },
                    headlineContent = {
                        CourierFixedText(
                            text = option.title,
                            style = MaterialTheme.typography.regular14.copy(
                                lineHeight = 20.sp
                            )
                        )
                    },
                    trailingContent = {
                        RadioButton(
                            selected = state.selectedOption == option,
                            onClick = null
                        )
                    },
                    colors = ListItemDefaults.colors().copy(
                        containerColor = MaterialTheme.colorScheme.surface,
                        headlineColor = MaterialTheme.colorScheme.onBackground,
                        supportingTextColor = MaterialTheme.colorScheme.secondary,
                        trailingIconColor = MaterialTheme.colorScheme.onBackground
                    )
                )
            }
        }
    }
}

@PreviewWrapper(ThemeWrapper::class)
@Preview(showBackground = true)
@Composable
private fun {Feature}PickerDialogPreview() {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}PickerDialog(
            state = {Feature}PickerDialogModel(
                selectedOption = {Feature}PickerOption.SampleA,
                options = listOf(
                    {Feature}PickerOption.SampleA,
                    {Feature}PickerOption.SampleB,
                    {Feature}PickerOption.SampleC
                )
            ),
            dispatch = {}
        )
    }
}

private fun optionItemShape(
    index: Int,
    lastIndex: Int
) = when {
    index == 0 && index == lastIndex -> RoundedCornerShape(16.dp)
    index == 0 -> RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 4.dp)
    index == lastIndex -> RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
    else -> RoundedCornerShape(4.dp)
}
```

Правила:
- Используй `AlertDialog` для диалогов с одной или несколькими кнопками.
- Используй `BasicAlertDialog` для диалогов без кнопок.
- Для `BasicAlertDialog` применяй `clip` и `background` прямо на modifier диалога.
- Делай preview каждого диалога внутри `Box(modifier = Modifier.fillMaxSize())`.
- В лямбдах кнопки подтверждения диспатчи intent подтверждения перед intent закрытия.
- Используй анонимизированные значения для preview, такие как `0000`, `SampleA`, `SampleB` и `SampleC`.
