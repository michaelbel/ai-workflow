---
name: create-signalr-channel
description: >-
  Use when пользователь просит добавить или изменить SignalR hub/channel, realtime DataSource,
  обработчики server events либо подключить канал к session lifecycle. Не используй для Ktor HTTP
  endpoint, Ktor WebSocket или общего socket-решения на другом протоколе.
metadata:
  author: michaelbel
---

# Создание SignalR-канала

Сначала изучи общую connection factory/infrastructure, существующие `RealtimeDataSource` и
`StartRealtimeUseCase`. Переиспользуй их retry, authentication и cleanup; не создавай второй
параллельный менеджер соединений.

## Реализация

- Создай один DataSource на один hub/domain и зарегистрируй server event handlers до `start`.
- Выполни команды подписки после успешного подключения.
- Для сигнала «authoritative state изменилось» используй приватный `MutableSharedFlow` и публичный
  read-only `SharedFlow`; его допустимо conflated/drop только когда следующий reload получает полное
  состояние. Для каждого обязательного payload-события используй lossless `Channel`/очередь либо
  durable Room-запись, а не `SharedFlow(replay = 0)`.
- По устойчивому событию вызывай обычный use case для reload/update Room, оставляя Room источником
  истины. Не обновляй UI напрямую payload-ом, если событие должно переживать пересоздание экрана.
- Подключи запуск DataSource и сбор его событий в `StartRealtimeUseCase`, чтобы смена session через
  отменяемый flow закрывала старые соединения и запускала новые с актуальным токеном.
- Запусти collectors до connect/initial subscription, например принятым в проекте undispatched
  start; альтернативно гарантируй initial reload после подключения, который перекрывает возможную
  потерю первого invalidation-сигнала.
- Используй общий retry/backoff. Никогда не поглощай `CancellationException`; cleanup выполняй в
  `finally`, при необходимости в `NonCancellable` с ограниченным timeout.
- Не допускай двух экземпляров одного hub для одной session и не повторяй retry после logout.
- Логируй lifecycle и ошибки без access token и чувствительного event payload.

Проверь сценарии connect/event/reload, reconnect, session change/logout и отмену во время retry или
cleanup. Если инфраструктуры realtime ещё нет, отдели shared connection factory от первого
domain-specific DataSource, не смешивая их ответственность.
