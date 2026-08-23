# Правила TextField

- Для `TextField`, являющихся полями поиска, храни значение как `TextFieldValue`, а не как `String`,
  и всегда явно устанавливай `selection`, чтобы курсор находился в конце текста, а не в начале:
  ```kotlin
  var textFieldValue by remember {
      mutableStateOf(
          TextFieldValue(
              text = state.query,
              selection = TextRange(index = state.query.length)
          )
      )
  }
  ```
- При программном обновлении текста поля поиска (например, из state после ответа сервера или сброса
  фильтра) пересоздавай `TextFieldValue` с `selection = TextRange(index = newText.length)`, чтобы
  курсор не сбрасывался в начало строки.
- Когда на экране несколько `TextField` расположены последовательно друг за другом, у всех полей,
  кроме последнего, устанавливай `keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)` и
  переводи фокус на следующее поле через `keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Next) })`.
- У последнего `TextField` в такой последовательности устанавливай
  `keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)` и скрывай клавиатуру через
  `keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })`.
