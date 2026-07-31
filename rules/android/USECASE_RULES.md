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
- `FlowUseCase` должен оборачивать один flow-метод DAO; если разным фильтрам нужны разные
  flow-методы DAO, создавай отдельные классы `FlowUseCase` вместо ветвления между вызовами DAO
  внутри одного use case.
- Называй сетевые use case по пути сетевого запроса или методу сетевого сервиса в PascalCase плюс
  `UseCase`; например, `ktorHttpClient.get("items/details")` должен быть `ItemsDetailsUseCase`, а
  `networkService.catalogBrandsFavorites(...)` — `CatalogBrandsFavoritesUseCase`. Не используй имена
  в стиле intent, такие как `Load...UseCase`, для прямых синхронных сетевых вызовов.
- Называй кастомные сетевые исключения по тому же пути запроса или методу сетевого сервиса в
  PascalCase плюс `Exception`; например, `ktorHttpClient.get("items/details")` должен использовать
  `ItemsDetailsException`, а `networkService.catalogBrandsFavorites(...)` —
  `CatalogBrandsFavoritesException`.
- Объявляй кастомные типы `data class` сетевых исключений внутри сетевого use case, который их
  выбрасывает.
- В сетевых use case создавай `val request = ...` внутри лямбды `request = { ... }` непосредственно
  перед вызовом `networkService`; никогда не создавай запрос вне этой лямбды и не встраивай его
  создание в аргументы `networkService`.
- Используй `handleResponse` для сетевых вызовов, обрабатываемых через callback; выбрасывай
  domain-специфичное исключение в `onFailure`.
- Используй `handleResponseResult(...).getOrThrow()`, когда сетевой ответ нужно потребить как
  значение внутри `execute`.
- Оборачивай несколько связанных операций записи в Room в `AppDatabase.withTransaction`.
- Держи логику маппинга в KTX-файлах мапперов; use case могут оркестрировать смапленные значения, но
  не должны обрастать inline-кодом мапперов.
- Новые use case — это конкретные классы с `@Inject constructor`, и обычно им не нужны модули Hilt
  `@Binds`.
- ViewModel-и внедряют конкретные нужные им use case, а не репозитории, интеракторы или агрегирующие
  фасады.
- В сетевых вызовах use case всегда создавай объекты запроса в отдельном локальном `val request`
  внутри `request = { ... }` перед вызовом `networkService`; не создавай запрос вне лямбды, не
  встраивай его создание inline и не передавай смапленные вызовы запроса напрямую в аргументы
  `networkService`.
- В use case используй `handleResponse` для сетевых вызовов в стиле callback и
  `handleResponseResult(...).getOrThrow()` при потреблении ответа как значения; не оборачивай
  результаты use case вручную в `Result.success` / `Result.failure`.
- При вызове `handleResponse` всегда передавай все три именованных аргумента: `request`, `onSuccess`
  и `onFailure`; в `onFailure` создавай отдельный `data class`-исключение, наследующее базовое
  сетевое исключение проекта, и выбрасывай его; перехватывай этот конкретный тип исключения в
  функции `catch` ViewModel.