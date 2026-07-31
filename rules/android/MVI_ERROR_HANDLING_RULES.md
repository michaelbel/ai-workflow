# Правила обработки ошибок в MVI

- Импортируй вложенные исключения use case напрямую в ViewModel, например
  `import shared.domain.usecase.ItemsDetailsUseCase.ItemsDetailsException`.
- В `catch` ViewModel обрабатывай специфичное сетевое исключение фичи раньше более общих исключений:
  сбрасывай связанный `Job` запроса в `null` и отправляй `SnackbarErrorMessage` с
  `throwable.message`.
- В `catch` ViewModel обрабатывай более общие значения `ClientException`, отправляя
  `SnackbarErrorMessage(throwable.message)`, обрабатывай `RoomException` и `RoomSQLiteException`,
  отправляя `SnackbarErrorMessage(throwable.message.orEmpty())`, а неизвестные ошибки делегируй в
  `super.catch(throwable)`.
