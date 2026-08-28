---
description: >-
  Bottom sheet фичи с постфиксом _sheet, rememberModalBottomSheetState(skipPartiallyExpanded =
  true), sheetState.hide() перед intent, preview в Box с fillMaxSize
paths:
  - "**/*.gradle.kts"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

- Пакеты bottom sheet фич в `features` используют постфикс `_sheet`, например
  `features/profile_sheet`.
- Используй file-level `@file:OptIn(ExperimentalMaterial3Api::class)`, когда файл использует
  Material3 API для bottom sheet.
- Создавай `sheetState` через `rememberModalBottomSheetState(skipPartiallyExpanded = true)`.
- Когда кнопка закрывает sheet, вызывай `sheetState.hide()` внутри `scope.launch` перед диспатчем
  intent подтверждения или закрытия.
- Делай preview для composable, который сам рендерит `SharedModalBottomSheet` или
  `ModalBottomSheet`; оборачивай его в многострочно оформленный `Box` с
  `modifier = Modifier.fillMaxSize()`, иначе preview bottom sheet может не отрендериться.
