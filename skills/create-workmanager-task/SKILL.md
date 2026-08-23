---
name: create-workmanager-task
description: >-
  Use when пользователь просит создать или изменить Android WorkManager-задачу, CoroutineWorker,
  её enqueue/cancel use case, constraints, unique work или retry policy. Не используй для обычного
  suspend use case без фонового планирования или для foreground service.
metadata:
  author: michaelbel
---

# Создание WorkManager-задачи

Перед изменениями изучи существующие worker, Hilt/WorkManager setup и способы вызова use case в
целевом проекте. Определи семантику задачи: one-time или periodic, unique identity, условия запуска,
временные и постоянные ошибки, отмена и идемпотентность.

## Реализация

- Создай тонкий `CoroutineWorker`, который валидирует input, вызывает существующий бизнес-use case
  через `.getOrThrow()` и преобразует результат в `success`, `retry` или `failure`. Для чисто
  системной операции вроде показа notification допустим прямой Android API без бизнес-логики.
- Следуй существующей Hilt-конвенции: `@HiltWorker`/`@AssistedInject` при настроенном
  `HiltWorkerFactory` либо существующий Hilt `EntryPoint`; не смешивай оба подхода.
- Создай отдельный scheduling `UseCase` и, когда сценарий требует отмены, cancellation `UseCase`.
  UI/ViewModel взаимодействуют с ними, а не с `WorkManager` и не с `Worker.enqueue()`.
- Используй stable unique work name/tag только при реальном identity задачи. Выбери
  `ExistingWorkPolicy` или `ExistingPeriodicWorkPolicy` по тому, должна ли новая заявка сохранять,
  заменять или продолжать старую.
- Добавь только необходимые `Constraints`, delay/interval и backoff. Для временных ошибок ограничь
  повторы через `runAttemptCount`, если продукт не требует неограниченного retry.
- Передавай через `Data` небольшие primitive/string значения. Для payload и очереди операций
  используй Room и передавай worker стабильный id.
- Пробрасывай `CancellationException`; не превращай отмену в результат работы.
- Держи операцию идемпотентной, поскольку повторный запуск возможен после частичного выполнения.
- Для account/session-scoped задачи включи owner/session generation в identity и input. Подключи
  отмену к logout, но не полагайся на неё как на барьер: worker повторно проверяет актуальную сессию
  перед запросом и перед Room commit и завершает устаревшую работу без записи.

Проверь, что worker доступен фабрике приложения, scheduling и cancellation используют одинаковый
identity, а тесты покрывают хотя бы permanent error, transient retry и success, если в проекте есть
WorkManager test infrastructure.
