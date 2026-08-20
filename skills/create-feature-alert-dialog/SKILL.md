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

Используй `AlertDialog`, когда в диалоге есть кнопки действий (с текстом, иконкой или списком в
слоте `text`). Используй `BasicAlertDialog`, когда кнопок действий нет.

## Фаза 1: создать папку фичи

Создай папку `features/{feature}_dialog` — постфикс `_dialog` обязателен, даже если фича сама по
себе не заканчивается на «диалог».

## Фаза 2: Intent и Model

Внутри `features/{feature}_dialog` создай папку `intent`. Папку `model` создавай только когда
диалогу нужны отображаемые данные; если данных нет, не создавай ни папку, ни файл Model.

Файлы:
- `features/{feature}_dialog/{Feature}Dialog.kt`
- `features/{feature}_dialog/intent/{Feature}Intent.kt`
- optional `features/{feature}_dialog/model/{Feature}Model.kt`

### {Feature}Intent.kt

```kotlin
package {package}.features.{feature}_dialog.intent

import {package}.shared.mvi.Intent

sealed interface {Feature}Intent: Intent {
    data object DismissClick: {Feature}Intent
}
```

Правила:
- `DismissClick` присутствует всегда.
- Если у диалога есть кнопка подтверждения, добавь `data object ConfirmClick: {Feature}Intent`.
- Для остальных действий (выбор опции, клик по элементу и т. д.) добавляй свои `data object` /
  `data class` записи; `data object` всегда идёт перед `data class`.

### {Feature}Model.kt (только если есть данные)

```kotlin
package {package}.features.{feature}_dialog.model

import {package}.shared.mvi.Model

data class {Feature}Model(
    val selectedOptionId: String = ""
): Model
```

## AlertDialog с заголовком и двумя кнопками (без Model)

```kotlin
package {package}.features.{feature}_dialog

// Добавь все необходимые импорты

@Composable
fun {Feature}Dialog(
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
                    style = MaterialTheme.typography.medium14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = { dispatch({Feature}Intent.DismissClick) }
            ) {
                Text(
                    text = stringResource(AppStrings.DialogCancel),
                    style = MaterialTheme.typography.regular14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        title = {
            Text(
                text = stringResource(AppStrings.{Feature}Title),
                style = MaterialTheme.typography.regular22.copy(
                    lineHeight = 22.sp
                )
            )
        },
        text = {
            Text(
                text = stringResource(AppStrings.{Feature}Message),
                style = MaterialTheme.typography.regular14.copy(
                    lineHeight = 20.sp
                )
            )
        },
        titleContentColor = MaterialTheme.colorScheme.onBackground,
        textContentColor = MaterialTheme.colorScheme.onSurfaceVariant2
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

## AlertDialog с одной кнопкой (иконка опциональна)

```kotlin
package {package}.features.{feature}_dialog

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
                    style = MaterialTheme.typography.medium14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        icon = {
            Icon(
                imageVector = {IconName},
                contentDescription = null,
                modifier = Modifier.size(44.dp)
            )
        },
        title = {
            Text(
                text = stringResource(AppStrings.{Feature}Title),
                style = MaterialTheme.typography.regular22.copy(
                    lineHeight = 22.sp
                )
            )
        },
        text = {
            Text(
                text = stringResource(AppStrings.{Feature}Message),
                style = MaterialTheme.typography.regular14.copy(
                    lineHeight = 20.sp
                )
            )
        },
        iconContentColor = MaterialTheme.colorScheme.error,
        titleContentColor = MaterialTheme.colorScheme.error,
        textContentColor = MaterialTheme.colorScheme.onBackground
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

Убери блок `icon` целиком и `iconContentColor`, если иконка не нужна; тогда `titleContentColor` /
`textContentColor` возвращаются к обычным `onBackground` / `onSurfaceVariant2`. Для диалогов
ошибок/предупреждений задавай `iconContentColor` и `titleContentColor` в
`MaterialTheme.colorScheme.error`.

## AlertDialog со списком в тексте (с Model)

Когда нужен диалог с заголовком, кнопками и выбираемым списком, размещай список внутри слота
`text`, а не переключайся на `BasicAlertDialog`.

```kotlin
package {package}.features.{feature}_dialog

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
                },
                enabled = state.selectedOptionId.isNotEmpty()
            ) {
                Text(
                    text = stringResource(AppStrings.DialogChoose),
                    style = MaterialTheme.typography.medium14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = { dispatch({Feature}Intent.DismissClick) }
            ) {
                Text(
                    text = stringResource(AppStrings.DialogCancel),
                    style = MaterialTheme.typography.regular14.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 20.sp
                    )
                )
            }
        },
        text = {
            Column {
                Text(
                    text = stringResource(AppStrings.{Feature}Title),
                    style = MaterialTheme.typography.regular22.copy(
                        color = MaterialTheme.colorScheme.onBackground,
                        lineHeight = 22.sp
                    )
                )

                Spacer(
                    modifier = Modifier.height(24.dp)
                )

                state.options.forEach { option ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .clickable { dispatch({Feature}Intent.OptionClick(option.id)) },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = option.title,
                            style = MaterialTheme.typography.regular14.copy(
                                color = MaterialTheme.colorScheme.onBackground,
                                lineHeight = 20.sp
                            )
                        )

                        RadioButton(
                            selected = state.selectedOptionId == option.id,
                            onClick = null
                        )
                    }

                    HorizontalDivider(
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.outlineVariant
                    )
                }
            }
        },
        titleContentColor = MaterialTheme.colorScheme.onBackground,
        textContentColor = MaterialTheme.colorScheme.onSurfaceVariant2
    )
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}DialogPreview(
    @PreviewParameter({Feature}ModelPreviewParameterProvider::class) state: {Feature}Model
) {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}Dialog(
            state = state,
            dispatch = {}
        )
    }
}

private class {Feature}ModelPreviewParameterProvider: PreviewParameterProvider<{Feature}Model> {
    private val options = listOf(
        {Feature}Option(id = "sample-a", title = "Sample A"),
        {Feature}Option(id = "sample-b", title = "Sample B"),
        {Feature}Option(id = "sample-c", title = "Sample C")
    )

    override val values: Sequence<{Feature}Model>
        get() = sequenceOf(
            {Feature}Model(options = options, selectedOptionId = "sample-a"),
            {Feature}Model(options = options, selectedOptionId = "")
        )
}
```

## BasicAlertDialog без кнопок

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}.features.{feature}_dialog

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
@Preview
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

## Фаза 3: вызов диалога с экрана

Диалог не хранит собственный ViewModel — видимостью и данными управляет экран, который его
открывает.

### 1. Флаг видимости в Model экрана

В `Model` вызывающего экрана добавь `Boolean`-поле `is{Feature}DialogVisible` — `is`, имя диалога
(с постфиксом `Dialog`), затем `Visible`:

```kotlin
data class {Screen}Model(
    val is{Feature}DialogVisible: Boolean = false
): Model
```

### 2. Показ диалога

Там, где решаешь открыть диалог, диспатчи `reduce`, выставляющий флаг в `true`:

```kotlin
reduce { it.copy(is{Feature}DialogVisible = true) }
```

### 3. Скрытие диалога

Добавь в `{Screen}Intent` экрана (не в `{Feature}Intent` самого диалога) событие
`Dismiss{Feature}Dialog` и обработай его в `dispatch` экрана:

```kotlin
sealed interface {Screen}Intent: Intent {
    data object Dismiss{Feature}Dialog: {Screen}Intent
}
```

```kotlin
override fun dispatch(intent: {Screen}Intent) {
    when (intent) {
        is {Screen}Intent.Dismiss{Feature}Dialog -> {
            reduce { it.copy(is{Feature}DialogVisible = false) }
        }
    }
}
```

### 4. Отрисовка

Рендери диалог внутри первой, публичной функции экрана (`{Screen}Screen`, не
`{Screen}ScreenContent`), сразу после вызова `{Screen}ScreenContent(...)`. В `dispatch`-лямбде
диалога перенаправляй каждый его intent в подходящий intent экрана — `DismissClick` обычно идёт в
`Dismiss{Feature}Dialog`:

```kotlin
@Composable
fun {Screen}Screen(
    viewModel: {Screen}ViewModel = hiltViewModel()
) {
    val state by viewModel.stateFlow.collectAsStateWithLifecycle()

    {Screen}ScreenContent(
        state = state,
        dispatch = viewModel::dispatch
    )

    if (state.is{Feature}DialogVisible) {
        {Feature}Dialog(
            dispatch = { intent ->
                when (intent) {
                    is {Feature}Intent.DismissClick -> {
                        viewModel.dispatch({Screen}Intent.Dismiss{Feature}Dialog)
                    }
                }
            }
        )
    }
}
```

### Если у диалога есть Model

Когда диалог принимает `state`, не храни отдельную копию его Model в экране — вычисляй её
свойством `get()` из уже существующих данных экрана:

```kotlin
data class {Screen}Model(
    val {feature}Message: String = "",
    val is{Feature}DialogVisible: Boolean = false
): Model {
    val {feature}Model: {Feature}Model
        get() = {Feature}Model(
            message = {feature}Message
        )
}
```

```kotlin
if (state.is{Feature}DialogVisible) {
    {Feature}Dialog(
        state = state.{feature}Model,
        dispatch = { intent ->
            when (intent) {
                is {Feature}Intent.ConfirmClick -> {
                    viewModel.dispatch({Screen}Intent.Dismiss{Feature}Dialog)
                }
            }
        }
    )
}
```

Правила:
- Используй `AlertDialog`, когда в диалоге есть кнопки действий (с текстом, иконкой или списком в
  `text`). Используй `BasicAlertDialog` только для пикера без кнопок действия.
- Для `BasicAlertDialog` применяй `clip` и `background` прямо на modifier диалога.
- На `AlertDialog` всегда указывай `titleContentColor` и `textContentColor` — обычно
  `MaterialTheme.colorScheme.onBackground` и `MaterialTheme.colorScheme.onSurfaceVariant2`; для
  диалогов ошибок/предупреждений — `MaterialTheme.colorScheme.error`.
- Sealed interface `{Feature}Intent` всегда содержит `DismissClick`; добавляй `ConfirmClick`,
  когда есть кнопка подтверждения.
- Создавай `{Feature}Model` только когда диалогу нужны отображаемые данные; иначе не создавай ни
  папку, ни файл `model`.
- Указывай `@file:OptIn(...)` перед `package`, когда используешь experimental API (например
  `BasicAlertDialog` требует `ExperimentalMaterial3Api`) или любой другой opt-in, нужный коду.
- Делай preview каждого диалога внутри `Box(modifier = Modifier.fillMaxSize())`; `showBackground =
  true` не указывай.
- Для preview с состоянием всегда создавай приватный `{Feature}ModelPreviewParameterProvider:
  PreviewParameterProvider<{Feature}Model>` в том же файле и передавай его через
  `@PreviewParameter`. Preview без состояния параметров не принимает.
- В лямбдах кнопки подтверждения диспатчи intent подтверждения перед intent закрытия.
- Используй анонимизированные значения для preview, такие как `0000`, `SampleA`, `SampleB` и
  `SampleC`.
- Видимостью диалога управляет вызывающий экран через `Boolean`-поле `is{Feature}DialogVisible` в
  своей `Model`; у самого диалога отдельной ViewModel нет.
- Скрытие диалога — отдельное событие `Dismiss{Feature}Dialog` в `{Screen}Intent` экрана, а не в
  `{Feature}Intent` диалога.
- Рендери диалог в первой, публичной функции экрана, сразу после вызова
  `{Screen}ScreenContent(...)`.
- Если диалогу нужна Model, вычисляй её свойством `get()` в `Model` экрана из уже существующих
  данных — не храни отдельную копию.
