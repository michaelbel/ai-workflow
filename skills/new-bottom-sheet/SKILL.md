---
name: new-bottom-sheet
description: >-
  Use when the user asks to create a Compose bottom sheet, modal sheet feature, or a `_sheet`
  package, or says "create a bottom sheet", "add a modal sheet", "new ModalBottomSheet". Covers
  the `{feature}_sheet` package layout, `SharedModalBottomSheet`, `rememberModalBottomSheetState`,
  and its preview. Do not use for a dialog with simple confirm/dismiss buttons; use
  new-alert_dialog instead. Do not use for a full navigable screen; use new-screen instead.
---

# Новый Bottom Sheet

Создаёт Compose bottom sheet проекта. Замени `{Feature}` на назначение sheet, `{feature}` на имя в lower camel case, а `{package}` на целевой пакет.

Используй этот скилл для bottom sheet фич в `features/{feature}_sheet`.

---

## {Feature}BottomSheet.kt

```kotlin
@file:OptIn(ExperimentalMaterial3Api::class)

package {package}

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.rememberModalBottomSheetState
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
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    SharedModalBottomSheet(
        onDismissRequest = { dispatch({Feature}SheetIntent.DismissClick) },
        sheetState = sheetState
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
- Используй file-level `@file:OptIn(ExperimentalMaterial3Api::class)`.
- Используй `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- Следуй правилам Compose: используй обёртку `Shared*` проекта, такую как `SharedModalBottomSheet`, когда она существует в проекте.
- Делай preview composable, который сам рендерит bottom sheet, а не отдельный приватный composable только с содержимым.
- Оборачивай preview bottom sheet в `Box(modifier = Modifier.fillMaxSize())`; иначе preview может не отрендериться.
- Используй анонимизированные тестовые данные для preview, такие как `sample-id`, `Sample item` и `Sample details`.
- Не добавляй пустые строки между соседними блоками `item {}` внутри `SharedLazyColumn`.
- Не добавляй `Spacer` без визуального назначения; используй `Spacer` только в конце списка, чтобы создать отступ под последним элементом.
