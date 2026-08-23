# Правила UseCase

- Размещай операции Room, Ktor, DataStore и бизнес-операции в конкретных классах `UseCase` /
  `FlowUseCase` в `shared/domain/usecase`; не создавай слои Repository или Interactor для новой
  работы.
- Используй `UseCase<P, R>` для одноразовых suspend-операций и `FlowUseCase<P, R>` для наблюдаемых
  потоков.
- Внедряй конкретные зависимости данных напрямую в конструктор use case: `NetworkService`,
  `AppDatabase`, классы DAO, классы DataStore, хелперы аналитики или другие use case при композиции
  операций.
- Внедряй `SharedDispatchers` как не-`private` параметр конструктора и передавай `dispatchers.io`
  для работы с Room/Ktor или `dispatchers.immediate` только для лёгкой по CPU немедленной работы.
- Не оборачивай `execute` в `withContext` или `flowOn`; базовый класс `UseCase` / `FlowUseCase` сам
  отвечает за переключение диспетчеров.
- `UseCase.execute` возвращает сырой domain-результат `R` и выбрасывает domain-специфичные
  исключения при ошибках; он не должен возвращать `Result`, `Result.success` или `Result.failure`.
- Вызывай другие экземпляры `UseCase` из `execute` с `.getOrThrow()`, чтобы ошибки распространялись
  в результат родительского `UseCase`.
- Вызывай экземпляры `UseCase` из ViewModel внутри `launch { ... }` и завершай каждый вызов через
  `.getOrThrow()`; обрабатывай выброшенные domain-, Room- и сетевые исключения в функции `catch`
  ViewModel.
- `FlowUseCase.execute` напрямую возвращает `Flow<R>`, не является `suspend` и не должен оборачивать
  значения в `Result`.
- Называй классы `FlowUseCase` по типу значения, которое они возвращают, плюс `FlowUseCase`;
  например, `Flow<List<ItemEntity>>` должен быть `ItemEntitiesFlowUseCase`, а `Flow<ItemEntity>` —
  `ItemEntityFlowUseCase`.
- При отсутствии входных параметров используй `Unit` как тип параметра и оставляй
  `execute(params: Unit)`.
- Для ровно одного входного параметра используй domain-тип как `P`, переименуй override-параметр в
  семантическое имя и добавь `@file:Suppress("PARAMETER_NAME_CHANGED_ON_OVERRIDE")`; не создавай
  `Params` data class с одним полем, даже если поле nullable или имеет значение по умолчанию.
- Для двух и более входных параметров определяй вложенный `data class Params(...)` внутри use case и
  используй `UseCase<FeatureUseCase.Params, R>` или `FlowUseCase<FeatureFlowUseCase.Params, R>`; не
  используй `Pair`, `Triple`, map-ы или несколько аргументов `invoke`.
- Если у use case есть вложенный класс `Params`, импортируй его напрямую
  (`import package.SomeUseCase.Params`) и используй только короткое имя в generic-сигнатуре:
  `UseCase<Params, Result>` или `FlowUseCase<Params, Result>`; не используй квалифицированную форму
  `SomeUseCase.Params`.
- Если у use case есть вложенный выходной/результирующий data class (например,
  `data class PaymentData` внутри `PaymentDataFlowUseCase`), импортируй его напрямую
  (`import package.SomeUseCase.PaymentData`) и используй только короткое имя везде, включая
  generic-сигнатуру: `FlowUseCase<Params, PaymentData>`; не используй квалифицированную форму
  `SomeUseCase.PaymentData`.
- Обычный `FlowUseCase`, наблюдающий Room, должен оборачивать один flow-метод DAO; если разным
  фильтрам нужны разные flow-методы DAO, создавай отдельные классы вместо ветвления внутри одного
  use case. Paging-`FlowUseCase` может строить `Pager(...).flow` из `PagingSource` и опционального
  `RemoteMediator`; не применяй к нему ограничение одного DAO Flow.
- Новые use case — это конкретные классы с `@Inject constructor`, и обычно им не нужны модули Hilt
  `@Binds`.
- Константы, относящиеся к логике конкретного use case (лимиты, ключи, таймауты, пути и т. п.),
  размещай в `companion object` этого use case; не выноси их в отдельные config-файлы или
  общие файлы констант, если они используются только этим use case.
