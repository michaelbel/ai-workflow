---
paths:
  - "**/*.kt"
---

# Правила MVI

- Экраны фич находятся в `features/{feature}` и разбиты на `{Feature}Screen.kt`,
  `{Feature}ViewModel.kt`, `model/{Feature}Model.kt`, `intent/{Feature}Intent.kt`, опционально
  `event/{Feature}Event.kt` и опционально `navigation/{Feature}Route.kt`.
- При создании нового экрана сразу создавай его файлы `{Feature}ViewModel.kt`,
  `model/{Feature}Model.kt` и `intent/{Feature}Intent.kt`, даже если начальное состояние экрана и
  intent-ы минимальны; не создавай отдельные composable-экраны без соответствующих MVI-классов.
- Классы `ViewModel` используют `@HiltViewModel`, инъекцию через конструктор и наследуются от общего
  базового MVI ViewModel проекта.
- Не размещай константы или функции-расширения в файлах/классах MVI `ViewModel`, `Screen`, `Intent`,
  `Model`, `Event` или `Route`; переноси их в отдельные не-MVI файлы/пакеты.
- Не размещай вспомогательные классы внутри MVI-классов; объявляй их на уровне файла или в отдельных
  файлах/пакетах.
- Не создавай и не храни изменяемые переменные в классах ViewModel; храни UI-состояние в классах
  Model. Допускается публичный immutable `Flow<PagingData<T>>`, собранный из параметров Model и
  закэшированный в lifecycle ViewModel; не дублируй его элементы или load state в Model.
- Размещай бизнес-логику, ветвление и решения экрана внутри соответствующей ветки intent в
  `dispatch`; composable-экраны и компоненты должны получать уже подготовленное UI-состояние и
  только диспатчить intent-ы.
- Класс `ViewModel` может объявлять только функции `dispatch` и `catch`; не объявляй в нём приватные
  или публичные вспомогательные функции. Встраивай вычисления и преобразования в соответствующую
  ветку `dispatch` либо выноси их из ViewModel в соответствующий архитектурный слой.
- `dispatch` — это `when` по всем веткам intent без `else`; состояние меняется только через
  `reduce { it.copy(...) }`.
- Одноразовые действия используют `send({Feature}Event...)` из ViewModel и `ObserveAsEvents` на
  экране.
- Типы `Intent`, `Model` и `Event` реализуют общие маркерные интерфейсы MVI проекта.
- ViewModel-и внедряют конкретные классы `UseCase` / `FlowUseCase`.
- Вызывай одноразовые use case внутри `launch { ... }` с `.getOrThrow()` и обрабатывай выброшенные
  исключения в функции `catch` ViewModel.
