---
name: create-feature-bottom-sheet
description: >-
  Use when пользователь просит создать Compose bottom sheet, modal sheet фичу или пакет `_sheet`,
  или говорит "create a bottom sheet", "add a modal sheet", "new ModalBottomSheet". Покрывает
  раскладку пакета `{feature}_sheet`, `SharedModalBottomSheet`, `rememberModalBottomSheetState` и
  его preview. Не используй для диалога с простыми кнопками confirm/dismiss; используй вместо этого
  [create-feature-alert-dialog](../create-feature-alert-dialog/SKILL.md). Не используй для полного
  навигируемого экрана; используй вместо этого
  [create-feature-scaffold-screen](../create-feature-scaffold-screen/SKILL.md).
metadata:
  author: michaelbel
---

# Новый Bottom Sheet

Требует зависимость `androidx.compose.material3:material3`.

Создаёт Compose bottom sheet проекта. Замени `{Feature}` на назначение sheet, `{feature}` на имя в
lower camel case, а `{package}` на целевой пакет.

## Фаза 1: создать папку фичи

Создай папку `features/{feature}_sheet` — постфикс `_sheet` обязателен, даже если фича сама по
себе не заканчивается на «шит».

## Фаза 2: Intent и Model

Внутри `features/{feature}_sheet` создай папку `intent`. Папку `model` создавай только когда sheet
нужны отображаемые данные; если данных нет, не создавай ни папку, ни файл Model.

Файлы:
- `features/{feature}_sheet/{Feature}BottomSheet.kt`
- `features/{feature}_sheet/intent/{Feature}SheetIntent.kt`
- optional `features/{feature}_sheet/model/{Feature}SheetModel.kt`

### {Feature}SheetIntent.kt

```kotlin
package {package}.features.{feature}_sheet.intent

import {package}.shared.mvi.Intent

sealed interface {Feature}SheetIntent: Intent {
    data object DismissClick: {Feature}SheetIntent
}
```

Правила:
- `DismissClick` присутствует всегда и всегда идёт первым интентом в `sealed interface`.
- Для остальных действий (клик по элементу, primary/secondary action и т. д.) добавляй свои
  `data object` / `data class` записи; `data object` всегда идёт перед `data class`.

### {Feature}SheetModel.kt (только если есть данные)

```kotlin
package {package}.features.{feature}_sheet.model

import {package}.shared.mvi.Model

data class {Feature}SheetModel(
    val showPrimaryAction: Boolean = false
): Model
```

## {Feature}BottomSheet.kt

```kotlin
package {package}

// Добавь все необходимые импорты

@Composable
fun {Feature}BottomSheet(
    state: {Feature}SheetModel,
    dispatch: ({Feature}SheetIntent) -> Unit
) {
    SharedModalBottomSheet(
        onDismissRequest = { dispatch({Feature}SheetIntent.DismissClick) }
    ) {
        SharedLazyColumn(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(
                start = 16.dp,
                top = 44.dp,
                end = 16.dp,
                bottom = 16.dp
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                {Feature}Card(
                    state = {Feature}CardState(
                        model = state.item,
                        onClick = { dispatch({Feature}SheetIntent.ItemClick) }
                    )
                )
            }
            if (state.showSecondaryAction) {
                item {
                    {Feature}SecondaryButton(
                        onClick = { dispatch({Feature}SheetIntent.SecondaryActionClick) }
                    )
                }
            }
            if (state.showPrimaryAction) {
                item {
                    Button(
                        onClick = { dispatch({Feature}SheetIntent.PrimaryActionClick) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        SharedFixedText(
                            text = stringResource(AppStrings.{Feature}PrimaryAction),
                            style = MaterialTheme.typography.medium16.copy(
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                }
            }
        }
    }
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Feature}BottomSheetPreview(
    @PreviewParameter({Feature}SheetModelPreviewParameterProvider::class) state: {Feature}SheetModel
) {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        {Feature}BottomSheet(
            state = state,
            dispatch = {}
        )
    }
}

private class {Feature}SheetModelPreviewParameterProvider: PreviewParameterProvider<{Feature}SheetModel> {
    override val values: Sequence<{Feature}SheetModel>
        get() {
            val item = {Feature}ItemModel(
                id = "sample-id",
                title = "Sample item",
                subtitle = "Sample details"
            )

            return sequenceOf(
                {Feature}SheetModel(
                    item = item,
                    showPrimaryAction = true,
                    showSecondaryAction = false
                ),
                {Feature}SheetModel(
                    item = item,
                    showPrimaryAction = false,
                    showSecondaryAction = true
                )
            )
        }
}
```

Правила:
- Используй обёртку `SharedModalBottomSheet`, а не сырой `ModalBottomSheet`.
- Не задавай `sheetState` вручную в фича-коде — `SharedModalBottomSheet` уже использует
  `rememberModalBottomSheetState(skipPartiallyExpanded = true)` по умолчанию.
- Не задавай `containerColor`, `sheetGesturesEnabled` или `dragHandle` — у `SharedModalBottomSheet`
  уже есть нужные умолчания (`dragHandle` всегда рисует `SharedDragHandle()`).
- Делай preview composable, который сам рендерит bottom sheet, а не отдельный приватный composable
  только с содержимым.
- Оборачивай preview bottom sheet в `Box(modifier = Modifier.fillMaxSize())`; иначе preview может
  не отрендериться.
- Используй анонимизированные тестовые данные для preview, такие как `sample-id`, `Sample item` и
  `Sample details`.
- Не добавляй пустые строки между соседними блоками `item {}` внутри `SharedLazyColumn`.
- Не добавляй `Spacer` без визуального назначения; используй `Spacer` только в конце списка, чтобы
  создать отступ под последним элементом.

## Фаза 3: вызов sheet с экрана

Sheet не хранит собственный ViewModel — видимостью и данными управляет экран, который его
открывает.

### 1. Флаг видимости в Model экрана

В `Model` вызывающего экрана добавь `Boolean`-поле `is{Feature}SheetVisible` — `is`, имя sheet
(с постфиксом `Sheet`), затем `Visible`:

```kotlin
data class {Screen}Model(
    val is{Feature}SheetVisible: Boolean = false
): Model
```

### 2. Показ sheet

Там, где решаешь открыть sheet, диспатчи `reduce`, выставляющий флаг в `true`:

```kotlin
reduce { it.copy(is{Feature}SheetVisible = true) }
```

### 3. Обработка intent'ов sheet в ViewModel экрана

Добавь в `{Screen}Intent` экрана один case `On{Feature}SheetIntent`, оборачивающий весь
`{Feature}SheetIntent` целиком — отдельный case на каждый intent sheet не создавай:

```kotlin
sealed interface {Screen}Intent: Intent {
    data class On{Feature}SheetIntent(val intent: {Feature}SheetIntent): {Screen}Intent
}
```

Разбирай `intent.intent` вложенным `when` внутри `dispatch` ViewModel экрана:

```kotlin
override fun dispatch(intent: {Screen}Intent) {
    when (intent) {
        is {Screen}Intent.On{Feature}SheetIntent -> {
            when (intent.intent) {
                is {Feature}SheetIntent.DismissClick -> {
                    reduce { it.copy(is{Feature}SheetVisible = false) }
                }
            }
        }
    }
}
```

### 4. Отрисовка

Рендери sheet внутри первой, публичной функции экрана (`{Screen}Screen`, не
`{Screen}ScreenContent`), сразу после вызова `{Screen}ScreenContent(...)`. В `dispatch`-лямбде sheet
просто пробрасывай весь intent в `On{Feature}SheetIntent`, не разбирая его case'ы в самом
composable:

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

    if (state.is{Feature}SheetVisible) {
        {Feature}BottomSheet(
            dispatch = { intent -> viewModel.dispatch({Screen}Intent.On{Feature}SheetIntent(intent)) }
        )
    }
}
```

### Если у sheet есть Model

Когда sheet принимает `state`, не храни отдельную копию его Model в экране — вычисляй её свойством
`get()` из уже существующих данных экрана. Имя свойства оканчивается на `State`, а не на `Model`
(сам тип остаётся `{Feature}SheetModel`):

```kotlin
data class {Screen}Model(
    val {feature}Item: {Feature}Item = {Feature}Item.Empty,
    val is{Feature}SheetVisible: Boolean = false
): Model {
    val {feature}SheetState: {Feature}SheetModel
        get() = {Feature}SheetModel(
            item = {feature}Item
        )
}
```

```kotlin
if (state.is{Feature}SheetVisible) {
    {Feature}BottomSheet(
        state = state.{feature}SheetState,
        dispatch = { intent -> viewModel.dispatch({Screen}Intent.On{Feature}SheetIntent(intent)) }
    )
}
```

Правила:
- Sheet не хранит собственный ViewModel; видимостью управляет `Boolean`-поле
  `is{Feature}SheetVisible` в `Model` вызывающего экрана.
- Экран оборачивает весь `{Feature}SheetIntent` в один case `On{Feature}SheetIntent(val intent:
  {Feature}SheetIntent)` своего `{Screen}Intent`; отдельных case'ов на каждый intent sheet не
  создавай — разбирай их вложенным `when` внутри `dispatch` ViewModel.
- Рендери sheet в первой, публичной функции экрана, сразу после вызова
  `{Screen}ScreenContent(...)`.
- Если sheet нужна Model, вычисляй её свойством `get()` в `Model` экрана из уже существующих
  данных — не храни отдельную копию; имя свойства оканчивается на `State`, а не на `Model`.
