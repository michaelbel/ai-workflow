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

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper
import androidx.compose.ui.unit.dp
import {package}.shared.ui.components.SharedLazyColumn
import {package}.shared.ui.components.SharedModalBottomSheet
import {package}.shared.ui.components.system.SharedFixedText
import {package}.shared.ui.preview.wrapper.ThemeWrapper
import {package}.shared.ui.theme.AppStrings
import {package}.shared.ui.theme.medium16

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
