---
paths:
  - "**/*.gradle.kts"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

# Правила Compose-экранов

- Публичный `{Feature}Screen(viewModel = hiltViewModel())` собирает state, создаёт
  remembered-хелперы событий, наблюдает события и делегирует UI приватному `{Feature}ScreenContent`.
- `*ScreenContent` получает `state`, `dispatch` и любые remembered UI-хелперы, нужные для preview.
- `*ScreenContent` и дочерние компоненты не должны содержать бизнес-логику или domain-решения;
  предоставляй производные UI-флаги/текст/действия из модели ViewModel и рендери их напрямую.
- Держи ветки состояния экрана, такие как loading, content, error и empty, inline в блоке `when`
  внутри `*ScreenContent`; не выделяй их в отдельные composable/функции `Loading`, `Content`,
  `Error` или `Empty`, если только они не являются переиспользуемыми реальными компонентами.
- Собирай state через `collectAsStateWithLifecycle()`.
- Наблюдай одноразовые события через `ObserveAsEvents`.
- Snackbar используют `SnackbarHostState`; закрывай `currentSnackbarData` перед показом нового
  snackbar.
- Используй `SnackbarMessage` для обычных информационных сообщений и `SnackbarErrorMessage` для
  сообщений об ошибках.
- Рендери диалоги и bottom sheet на основе явного свойства `is...Visible` в `Model` экрана; не
  используй проверки nullable payload как условие видимости. Передавай nullable данные payload в
  модель диалога/sheet отдельно.
- Размещай каждый диалог и bottom sheet в отдельном одиночном `if (state.is...Visible)`; не
  используй `when` для выбора между диалогами и bottom sheet.
- Объявляй простые shape inline, например `RoundedCornerShape(8.dp)`, вместо выделения их в
  переменные `private val` уровня фичи.
- Добавляй новые цвета в цвета UI kit проекта и используй их через `MaterialTheme.colorScheme`; не
  держи сырые константы `Color(0x...)` в файлах фич.
