# Правила Shimmer / Loading Placeholder

- Используй
  `Modifier.placeholder(visible = ..., highlight = PlaceholderHighlight.shimmer(), color = MaterialTheme.colorScheme.surfaceContainerHigh, shape = RoundedCornerShape(...))`
  для skeleton-загрузки.
- Используй `Spacer` для отдельного placeholder без дочернего содержимого; не используй пустой `Box`
  только для рендеринга placeholder. Используй `Box` только когда placeholder также должен служить
  контейнером для дочерних composable.
- Всегда передавай `visible = state.isLoading` (или соответствующий boolean) — не хардкодь
  `visible = true`, кроме как внутри выделенных loading-composable.
- Используй `MaterialTheme.colorScheme.surfaceContainerHigh` как цвет placeholder; не используй
  сырые константы `Color`.
- Для кнопки действия или кнопки в слоте `floatingActionButton` держи реальную кнопку в composition
  во время загрузки и применяй
  `Modifier.placeholder(visible = state.isLoading, highlight = PlaceholderHighlight.shimmer(), color = MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(...))`
  прямо к её modifier; не заменяй кнопку условным placeholder `Spacer`.
- Согласуй `shape` placeholder с формой реального содержимого, которое он представляет (например,
  `RoundedCornerShape(16.dp)` для карточек, `RoundedCornerShape(8.dp)` для меньших элементов).
- Для полноэкранных или секционных состояний загрузки создавай выделенный loading-composable
  (например, `PageLoading`, `SectionLoading`), использующий `SharedLazyColumn` с
  `userScrollEnabled = false` и элементы `Spacer`, оформленные через
  `.placeholder(visible = true, ...)`.
- В выделенных loading-composable `visible` всегда `true`; вызывающий код решает, когда показывать
  composable.
- Импортируй `PlaceholderHighlight` и `placeholder`/`shimmer` из общего UI-модуля проекта, а не
  напрямую из сторонней библиотеки.
