---
name: create-paging-flow
description: >-
  Use when пользователь просит добавить Android Paging 3 поток, пагинируемый список или бесконечную
  загрузку через Room PagingSource, network PagingSource либо RemoteMediator с локальным кэшем,
  включая Pager, FlowUseCase и подключение Compose UI. Не используй для обычного непагинируемого
  списка во Flow, ручной кнопки «загрузить ещё» или карусели с уже загруженными элементами. Не
  создавай Room-кэш или RemoteMediator, если задача требует только network-only пагинацию.
metadata:
  author: michaelbel
---

# Новый Paging-поток

Создаёт один согласованный Paging 3 pipeline от выбранного источника до Compose UI. Сначала выбери
режим по источнику истины; не добавляй слои только ради симметрии.

## Выбери режим

### Room-backed

Используй, когда данные уже хранятся локально и сеть не участвует. DAO возвращает
`PagingSource<Int, Entity>`, а `Pager` получает его через `pagingSourceFactory`. Любое изменение
фильтра должно создавать новый PagingSource.

### Network-only

Используй отдельный `PagingSource<Key, Item>`, когда кэш не нужен. Тип ключа должен соответствовать
API: page number, offset или непрозрачный token. Не переводись между этими схемами без необходимости.

### Network + Room cache

Используй `RemoteMediator` только когда Room является источником данных для UI, а сеть пополняет и
обновляет кэш. Нужны DAO `PagingSource`, remote keys, сетевые модели/мапперы и транзакционное
обновление кэша. Идентичность remote key должна включать все параметры выдачи, которые меняют
результат: пользователя, категорию, фильтры, сортировку и поисковый текст по необходимости.

Сформируй один канонический `scopeId` из стабильно сериализованных result-shaping параметров. Один
и тот же scope используй в remote key, ключе result-membership/cache entity, DAO `WHERE` и
`ORDER BY`, refresh-delete и позиции mapper. Основную domain entity можно разделять между выдачами,
но её membership/position обязаны оставаться scope-specific.

## Собери pipeline

1. Определи key scheme, page size, initial load size, placeholder policy и точный признак конца
   выдачи. Используй фактический `params.loadSize`, если endpoint поддерживает динамический limit.
2. Для network `PagingSource` реализуй `load` без пропусков и дублей. Рассчитывай `prevKey`,
   `nextKey` и `getRefreshKey` в одной системе координат; offset увеличивай на реально полученное
   число элементов, а token бери только из ответа сервера.
3. Для Room добавь детерминированный `ORDER BY` со стабильным tie-breaker. Возвращай новый
   `PagingSource` из factory, не сохраняй его экземпляр.
4. Для `RemoteMediator` обработай `REFRESH`, `PREPEND` и `APPEND` явно. Если API не поддерживает
   prepend, заверши его успешно. На refresh сбрасывай только кэш и keys текущей выдачи; данные другой
   выдачи не затрагивай.
5. Обновляй remote keys и соответствующие entities в одной `AppDatabase.withTransaction`.
   Сетевой вызов и маппинг выполняй до транзакции. Не очищай успешный кэш перед сетью так, чтобы
   ошибка refresh оставляла пустой экран.
6. Помести `Pager(...).flow` в конкретный `FlowUseCase<Params, PagingData<T>>`. Внедри в него DAO,
   `AppDatabase`, `NetworkService` и нужные use case напрямую согласно выбранному режиму.
7. ViewModel предоставляет поток, применяет `cachedIn` в своём lifecycle и пересоздаёт pipeline при
   изменении query через flow-оператор вроде `flatMapLatest`. Compose собирает его через
   `collectAsLazyPagingItems()`.

## Ошибки и состояния UI

- Возвращай transport/domain ошибки как `LoadResult.Error` или `MediatorResult.Error`; не превращай
  ошибку в пустую успешную страницу.
- Не поглощай `CancellationException` общим `catch (Throwable)`.
- Различай `loadState.refresh` и `loadState.append`: refresh управляет полноэкранным loading/error,
  append — нижним индикатором и retry рядом с концом списка.
- Empty state показывай только после успешного refresh при `itemCount == 0`; старый кэш при refresh
  не является empty state.
- Pull-to-refresh и retry проходят через отдельные MVI Intent/Event: content диспатчит Intent,
  ViewModel отправляет одноразовый Event, а публичный Screen вызывает `pagingItems.refresh()` или
  `pagingItems.retry()` внутри `ObserveAsEvents`.
- Используй стабильные ключи элементов, когда они доступны, и не копируй весь `PagingData` в MVI
  model или обычный `List`.

## Инварианты RemoteMediator

- Порядок записей в Room хранит server ordering явно, например через `position` внутри scope
  выдачи.
- Remote key и кэшированная membership-запись используют один и тот же канонический scope; не
  позволяй фильтру, сортировке или пользователю разделять key, но смешивать строки результата.
- End-of-pagination вычисляется по server token/metadata либо по размеру ответа относительно
  запрошенного limit; не смешивай признаки из разных API.
- Первый APPEND без подходящего remote key не должен повторно загружать первую страницу.
- Ошибка не продвигает key и не оставляет частично записанную страницу.
- Refresh одного набора параметров не удаляет remote keys другого набора.

## Проверка результата

Проверь initial load, append, refresh, retry после сетевой ошибки, восстановление экрана после
recreation, пустую выдачу, последнюю неполную страницу и смену каждого параметра запроса. Для
RemoteMediator дополнительно проверь offline-чтение кэша, атомарность entity/key и отсутствие
дубликатов после повторного APPEND.
