# Room-backed collect/load screen

Используй этот режим, когда Room является источником отображаемых данных, а сеть обновляет Room.

## Контракт

- Создай отдельные intent-ы `Collect{Feature}` и `Load{Feature}`. Не объединяй бесконечное
  наблюдение и одноразовое обновление в одну ветку.
- В `init` сначала запускай collect intent, затем load intent, если экран должен автоматически
  обновиться из сети.
- В collect-ветке собирай `FlowUseCase` и обновляй Model через `reduce` при каждом значении.
- Для сетевого обновления храни nullable request-`Job` в Model и вычисляй loading из его активности.
  В load-ветке сохрани запущенный `Job`, сбрось его через `invokeOnCompletion` и вызови одноразовый
  use case через `.getOrThrow()`.
- Не копируй сетевой response в Model: load use case записывает Room, а collect-ветка доставляет
  новое состояние.
- Pull-to-refresh повторно отправляет load intent либо отдельный refresh intent только при
  необходимости собственного UI-состояния.
- Loading/empty вычисляй из реального состояния фичи; не добавляй `isLoading`, если пустая Room-
  коллекция уже однозначно задаёт initial state.

Если поток данных отсутствует, собери его через `create-data-layer` с вариантом
Ktor → mapper → Room. Screen зависит только от готовых `UseCase` / `FlowUseCase`.
