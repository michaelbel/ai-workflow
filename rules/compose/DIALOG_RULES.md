# Правила Dialog

- Используй `AlertDialog`, когда в диалоге есть кнопки действий; используй `BasicAlertDialog`, когда
  кнопок действий нет.
- Для `AlertDialog` передавай слот `icon`, когда нужна иконка; устанавливай
  `modifier = Modifier.size(...)` на `Icon`.
- Для `AlertDialog` передавай слот `title`, когда у диалога есть заголовок.
- Для `AlertDialog` передавай тело диалога через слот `text`.
- Для `AlertDialog` устанавливай `iconContentColor`, `titleContentColor` и `textContentColor`, когда
  нужны кастомные цвета содержимого.
- Для `BasicAlertDialog` применяй `clip` и `background` прямо на modifier.
- Всегда устанавливай
  `modifier = Modifier.fillMaxWidth().wrapContentHeight().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceContainerHigh)`
  на `BasicAlertDialog`.
- Делай preview composable-диалогов внутри `Box(modifier = Modifier.fillMaxSize())`; иначе preview
  `AlertDialog`/`BasicAlertDialog` может не отрендериться.
- Оборачивай прокручиваемое содержимое в `Column` с `weight(1F, fill = false)` и
  `verticalScroll(rememberScrollState())`, чтобы обрабатывать длинный текст без обрезки.
- Размещай кнопки действий в `FlowRow` с
  `horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)` и
  `verticalArrangement = Arrangement.spacedBy(8.dp)`.
- В лямбде кнопки подтверждения вызывай `onConfirmRequest()` перед `onDismissRequest()`.
- Внешний `Column` использует `verticalArrangement = Arrangement.spacedBy(40.dp)` между колонкой
  содержимого и рядом кнопок.
