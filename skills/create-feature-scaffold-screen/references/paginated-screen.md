# Paginated screen

Используй этот режим, когда экран получает `Flow<PagingData<Item>>` и отображает Paging load states.

## ViewModel

- Предпочитай готовый paging use case. Публичный `val {items}PagingFlow` может быть исключением из
  правила «всё состояние в Model»: это immutable data stream, а не вручную изменяемое UI-состояние.
- Заверши paging flow через `cachedIn(this)` либо эквивалент, уже принятый базовым ViewModel проекта.
- Если запрос зависит от фильтра/поиска, храни параметры в Model и строй flow как
  `stateFlow.map { ... }.distinctUntilChanged().flatMapLatest { pagingUseCase(it) }.cachedIn(this)`.
  Не держи второй mutable-набор тех же параметров.
- Состояния toolbar, selection и pull-to-refresh остаются в Model.

## Screen

- В публичном Screen вызови `collectAsLazyPagingItems()` и передай результат в content отдельно от
  Model.
- Рендери initial loading, append loading, empty и error по `loadState`, не дублируя их вручную в
  Model.
- Retry и refresh начинаются с отдельных Intent. ViewModel отправляет одноразовый Event, публичный
  Screen обрабатывает его через `ObserveAsEvents` и вызывает `pagingItems.retry()` или
  `pagingItems.refresh()`; content только диспатчит Intent. После MVI-coordinated refresh отправь
  завершающий intent для сброса `isRefreshing`, если Model хранит это UI-состояние.
- Preview создаёт `PagingData.from(items)` через локальный Flow и передаёт полученные
  `LazyPagingItems` в content.

Этот skill оформляет только экран. `PagingSource`, `Pager`, `RemoteMediator`, DAO и API относятся к
data/domain-потоку и должны быть готовы заранее либо созданы через `create-paging-flow`.
