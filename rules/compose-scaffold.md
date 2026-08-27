---
paths:
  - "**/*.gradle.kts"
  - "**/*.gradle"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила Scaffold

- Snackbar для обычных сообщений размещай внутри `snackbarHost` в `Scaffold`; snackbar, которые
  должны появляться над статус-баром (верхние баннеры ошибок), размещай вне `Scaffold` в
  оборачивающем `Box`, выровненном по `Alignment.TopCenter`, с `Modifier.statusBarsPadding()`.
- Рендери содержимое обычного snackbar через `SnackbarMessage`; содержимое snackbar ошибки — через
  `SnackbarErrorMessage`.
- Когда два snackbar сосуществуют внутри `snackbarHost`, оборачивай их в `Box` и используй отдельные
  экземпляры `SnackbarHostState` с разными значениями `containerColor`.
- FAB всегда использует `floatingActionButtonPosition = FabPosition.Center`; применяй горизонтальный
  padding через `Modifier.padding(horizontal = 16.dp)` на самой кнопке.
- Когда экрану нужна статичная кнопка действия, закреплённая внизу, размещай её в слоте
  `floatingActionButton` в `Scaffold`, а не в `bottomBar`.
- Закрывай текущий snackbar перед показом нового: вызывай `hostState.currentSnackbarData?.dismiss()`
  перед `scope.launch { hostState.showSnackbar(...) }`.
- Всегда оборачивай `Scaffold` в многострочно оформленный `Box` с
  `modifier = Modifier.fillMaxSize()`, когда верхний snackbar нужно разместить вне scaffold.
