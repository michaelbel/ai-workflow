---
name: create-feature-scaffold-screen
description: >-
  Use when пользователь просит создать новый Android Compose-экран или MVI-фичу с
  Screen/ViewModel/Intent/Model/Event и опциональным route. Поддерживает static, network-only,
  Room-backed collect/load, form и paginated экраны. Не используй для отдельного переиспользуемого
  компонента, alert dialog или bottom sheet; используй create-shared-component,
  create-feature-alert-dialog или create-feature-bottom-sheet. Не используй только для data/domain
  слоя без экрана.
metadata:
  author: michaelbel
---

# Новый MVI-экран

Создай экран в `features/{feature}`, где `{feature}` — snake_case, `{Feature}` — PascalCase, а
`{package}` — пакет целевого проекта.

Обычный набор файлов:

- `{Feature}Screen.kt`
- `{Feature}ViewModel.kt`
- `model/{Feature}Model.kt`
- `intent/{Feature}Intent.kt`
- `event/{Feature}Event.kt`, только если нужны одноразовые эффекты
- `navigation/{Feature}Route.kt`, только если экран участвует в навигации

## Выбери режим

Изучи ближайший аналогичный экран и выбери основной режим. Затем обязательно прочитай только его
reference. Для гибридного экрана прочитай references только для реально объединяемых режимов.

| Режим                    | Когда выбирать                                                                | Reference                                                   |
| ------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| static                   | Нет загрузки данных; экран отображает заданное состояние и локальные действия | [static-screen.md](references/static-screen.md)             |
| network-only             | Одноразовый сетевой результат сразу становится состоянием экрана, без Room    | [network-only-screen.md](references/network-only-screen.md) |
| Room-backed collect/load | Room — источник истины, сеть только обновляет его                             | [room-backed-screen.md](references/room-backed-screen.md)   |
| form                     | Пользователь редактирует поля и отправляет значения                           | [form-screen.md](references/form-screen.md)                 |
| paginated                | Экран отображает `PagingData` и load states                                   | [paginated-screen.md](references/paginated-screen.md)       |

Если нужный endpoint, storage, mapper или use case отсутствует, сначала примени соответствующий
атомарный skill либо `create-data-layer` для составного потока. Экранный skill не создаёт эти слои
скрыто.

## Общие MVI-инварианты

- Всё изменяемое UI-состояние хранится в `{Feature}Model` и меняется только через
  `reduce { it.copy(...) }`. Не держи дублирующие mutable-поля во ViewModel или Composable.
- Исключение для Paging — публичный immutable `Flow<PagingData<T>>`; параметры, влияющие на этот
  Flow, всё равно хранятся в Model.
- Каждый intent представляет одно действие пользователя или lifecycle-событие. В sealed interface
  размещай `data object` перед `data class`.
- `dispatch` использует исчерпывающий `when` без `else`. Обрабатывай поведение прямо в его ветках;
  не выноси ветки в приватные handler-функции.
- Внедряй конкретные `UseCase` / `FlowUseCase`, а не Repository, Interactor или агрегирующий фасад.
  Одноразовые use case вызывай через `.getOrThrow()` внутри `launch { ... }`; исключения обрабатывай
  в принятом проектом `catch` ViewModel.
- События применяй только для одноразовых эффектов: навигации, snackbar, диалога или команды
  обновить Paging. Постоянные данные в Event не храни.
- Публичный `{Feature}Screen(viewModel = hiltViewModel())` собирает state через
  `collectAsStateWithLifecycle()`, наблюдает event flow при его наличии и делегирует UI приватному
  `{Feature}ScreenContent`.
- `{Feature}ScreenContent` получает state/data и callback `dispatch`; он не знает о ViewModel.
  Preview создавай для content через `@PreviewWrapper(ThemeWrapper::class)` и приватный
  `PreviewParameterProvider`.
- Применяй `innerPadding` из `Scaffold` через `contentPadding` списка или `Modifier.padding` обычного
  содержимого. Добавляй file-level opt-in только для реально используемых experimental API.

## Навигация и завершение

При необходимости создай route и зарегистрируй его в существующем navigation graph тем же
способом, что соседние фичи. Не вводи новую навигационную абстракцию. Проверь loading, content,
empty и error-состояния, которые действительно принадлежат выбранному режиму, preview-варианты и
сборку затронутого модуля.
