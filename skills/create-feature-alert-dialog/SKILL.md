---
name: create-feature-alert-dialog
description: >-
  Use when пользователь просит создать в Compose диалог подтверждения, alert dialog, picker dialog
  или простой status popup с явным действием confirm/dismiss, либо говорит "create a dialog", "add
  an alert dialog", "confirmation popup", "new AlertDialog". Строит `AlertDialog` с одной или двумя
  кнопками для подтверждающих сценариев и `BasicAlertDialog` — для пикера без кнопок действия. Если
  нужна прокручиваемая модальная поверхность, закреплённая снизу экрана, используй
  [create-feature-bottom-sheet](../create-feature-bottom-sheet/SKILL.md) вместо этого скилла. Для
  полного экрана используй
  [create-feature-scaffold-screen](../create-feature-scaffold-screen/SKILL.md), для простого
  переиспользуемого компонента без диалоговой семантики —
  [create-shared-component](../create-shared-component/SKILL.md).
metadata:
  author: michaelbel
---

# Новый Alert Dialog

Требует зависимость `androidx.compose.material3:material3`.

Создаёт Compose-диалог проекта. Замени `{Feature}` на назначение диалога, `{feature}` на имя в
lower camel case, а `{package}` на целевой пакет.

Используй `AlertDialog`, когда в диалоге есть кнопки действий. Используй `BasicAlertDialog`, когда
кнопок действий нет.

## AlertDialog с двумя кнопками

```kotlin
package {package}

// Добавь все необходимые импорты

@Composable
fun {Feature}Dialog(
    state: {Feature}Model,
    dispatch: ({Feature}Intent) -> Unit
) {
    AlertDialog(
        onDismissRequest = { dispatch({Feature}Intent.DismissClick) },
        confirmButton = {
            TextButton(
                onClick = {
                    dispatch({Feature}Intent.ConfirmClick)
                    dispatch({Feature}Intent.DismissClick)
                }
            ) {
                Text(
                    text = stringResource(AppStrings.{Feature}Confirm),
                    style = MaterialTheme.typography.buttonText
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = { dispatch({Feature}Intent.DismissClick) }
            ) {
                Text(
                    text = stringResource(AppStrings.DialogCancel),
                    style = MaterialTheme.typography.buttonText
                )
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                Text(
                    text = stringResource(AppStrings.{Feature}Title),
                    style = MaterialTheme.typography.titleText
                )

                Text(
                    text = stringResource(AppStrings.{Feature}Message),
                    style = MaterialTheme.typography.messageText
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
            state = {Feature}Model(
                sampleValue = "0000"
            ),
            dispatch = {}
        )
    }
}
```

## AlertDialog с одной кнопкой

```kotlin
package {package}

// Добавь все необходимые импорты

@Composable
fun {Feature}Dialog(
    dispatch: ({Feature}Intent) -> Unit
) {
    AlertDialog(
        onDismissRequest = { dispatch({Feature}Intent.DismissClick) },
        confirmButton = {
            TextButton(
                onClick = { dispatch({Feature}Intent.DismissClick) }
            ) {
                Text(
                    text = stringResource(AppStrings.DialogOk),
                    style = MaterialTheme.typography.buttonText
                )
            }
        },
        text = {
            Text(
                text = stringResource(AppStrings.{Feature}Message),
                style = MaterialTheme.typography.messageText
            )
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
            dispatch = {}
        )
    }
}
```

## BasicAlertDialog без кнопок

```kotlin
package {package}

// Добавь все необходимые импорты

@Composable
fun {Feature}Dialog(
    state: {Feature}Model,
    dispatch: ({Feature}Intent) -> Unit
) {
    BasicAlertDialog(
        onDismissRequest = { dispatch({Feature}Intent.DismissClick) },
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
            Text(
                text = stringResource(AppStrings.{Feature}Title),
                modifier = Modifier.padding(horizontal = 24.dp),
                style = MaterialTheme.typography.titleText
            )

            Spacer(
                modifier = Modifier.height(12.dp)
            )

            state.options.forEachIndexed { index, option ->
                SegmentedListItem(
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .clickable {
                            dispatch({Feature}Intent.OptionClick(option))
                            dispatch({Feature}Intent.DismissClick)
                        },
                    headlineContent = {
                        Text(
                            text = option.title,
                            style = MaterialTheme.typography.headlineText
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
private fun {Feature}Preview() {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}Dialog(
            state = {Feature}Model(
                selectedOption = {Feature}Option.SampleA,
                options = listOf(
                    {Feature}Option.SampleA,
                    {Feature}Option.SampleB,
                    {Feature}Option.SampleC
                )
            ),
            dispatch = {}
        )
    }
}
```

Правила:
- Используй `AlertDialog` для диалогов с одной или несколькими кнопками.
- Используй `BasicAlertDialog` для диалогов без кнопок.
- Для `BasicAlertDialog` применяй `clip` и `background` прямо на modifier диалога.
- Делай preview каждого диалога внутри `Box(modifier = Modifier.fillMaxSize())`.
- В лямбдах кнопки подтверждения диспатчи intent подтверждения перед intent закрытия.
- Используй анонимизированные значения для preview, такие как `0000`, `SampleA`, `SampleB` и
  `SampleC`.
