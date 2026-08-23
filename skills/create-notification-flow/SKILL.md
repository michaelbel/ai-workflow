---
name: create-notification-flow
description: >-
  Use when пользователь просит реализовать Android local или push notification flow: routing
  входящего push, notification channels, runtime permission, стабильные tag/id, отображение,
  deep link/PendingIntent или обработку push token. Не используй для in-app списка уведомлений без
  системных Android notifications и не добавляй WorkManager только потому, что событие приходит в
  фоне; подключай его лишь когда работа действительно должна быть durable, отложенной или
  ограниченной constraints.
metadata:
  author: michaelbel
---

# Поток Android-уведомлений

Создаёт цельный путь от локального события или push payload до корректного системного уведомления и
целевого экрана. Сохраняй push service тонким: он маршрутизирует событие, делегирует специализированным
handlers и показывает fallback notification, но не выполняет тяжёлую бизнес-операцию сам.

## Определи маршрутизацию

Для каждого типа события зафиксируй:

- источник: local domain event, FCM notification payload, FCM data payload или сторонний push SDK;
- нужно ли только обновить локальные данные, показать notification или сделать оба действия;
- целевой route и минимальные валидируемые аргументы;
- deduplication identity и поведение повторной доставки;
- channel, importance, звук/badge и видимость чувствительных данных на lock screen.

Считай push payload недоверенным вводом. Валидируй type, идентификаторы и route arguments; неизвестный
тип не должен открывать произвольный экран или падать. Сначала отдавай SDK-owned сообщения его SDK,
затем проверяй специализированные handlers, после них используй общий display fallback.

Перед открытием account-scoped route проверь активную сессию и принадлежность объекта текущему
пользователю. Используй allowlist разрешённых route; старое или чужое notification направляй в
безопасный стартовый/auth flow без передачи непроверенного идентификатора.

## Channels и ресурсы

- Создай стабильный channel ID и пользовательские name/description через строковые ресурсы и фасад
  строк проекта. Channel можно зарегистрировать при старте приложения или непосредственно перед
  первым показом.
- Не меняй значение channel ID между запусками. Android сохраняет пользовательские настройки канала;
  если продукту действительно нужна несовместимая новая importance/behavior, создай новый versioned
  ID и продумай судьбу старого канала.
- Выбери importance и category по смыслу уведомления, не повышай их ради заметности. Small icon
  должен быть валидным monochrome notification asset.

## Permission

Добавь manifest permission и runtime flow для `POST_NOTIFICATIONS`, когда приложение поддерживает
API 33+. Проверяй API числовым уровнем. Запрашивай permission из UI после понятного пользовательского
контекста, не из service/manager и не автоматически при получении push.

Перед `notify` снова проверь permission/notification availability. При отказе не вызывай `notify` и
не считай это исключением доставки; выполни только ту domain-часть события, которая не зависит от
системного уведомления. Политику повторного prompt храни отдельно от факта permission, например в
DataStore, если продукт действительно её задаёт.

## Stable identity и PendingIntent

- Используй стабильный tag/id из message ID или domain entity ID, чтобы повтор того же события
  обновлял ожидаемое notification. Для независимых уведомлений не используй один общий ID.
- Hash допустим только при принятом риске коллизии; tag с namespace помогает разделить категории.
- Создай explicit `Intent`/type-safe deep link к приложению, восстанови ожидаемый back stack и
  передай только необходимые аргументы.
- Request code должен различать PendingIntent разных целей. Используй `FLAG_IMMUTABLE` и
  `FLAG_UPDATE_CURRENT`, когда требуется обновить extras существующей цели; не делай mutable
  PendingIntent без API, которому это действительно необходимо.
- Добавь `setAutoCancel(true)` и content intent для открываемого уведомления. Action intents должны
  иметь собственную identity и безопасную проверку входных данных.

## Local и push paths

Для local notification Android adapter/handler/worker вызывает общий notification builder/manager;
domain use case только сообщает о событии и не зависит от Android notification API. Для push
реализуй `FirebaseMessagingService` или существующий service проекта:

1. Нормализуй title/body/data из payload.
2. Передай SDK-related сообщение соответствующему SDK.
3. Дай feature handler обработать data-only команду, если она не должна показывать общий fallback.
4. Иначе вызови общий manager с normalized payload и stable identity.
5. В `onNewToken` делегируй регистрацию токена существующему use case/SDK. Не логируй полный токен и
   не блокируй callback долгой синхронной работой.

Для бизнес-данных data-only push является invalidation-сигналом к обычному server sync, а не
единственным источником полного состояния. Добавь recovery sync при старте авторизованной сессии
или resume, потому что доставка push может быть пропущена или задержана.

Не добавляй WorkManager для обычного немедленного `notify`. Используй его, только если обработка
должна пережить process death, требует сети/зарядки, может превысить допустимое время callback или
должна быть отложена; тогда worker выполняет domain work, а общий manager остаётся владельцем показа.

## Отображение и проверка

Title/body получают безопасные defaults, blank body не создаёт пустой стиль, длинный body использует
`BigTextStyle`. Не помещай секреты, токены или лишние персональные данные в extras и видимый текст.

Проверь API ниже 33 и 33+, granted/denied permission, отключённые уведомления и channel, foreground и
background data payload, повтор message ID, два разных сообщения, cold-start deep link, смену
аккаунта перед открытием, уже открытое приложение, некорректный payload, пропущенный push с recovery
sync и token refresh. Отдельно проверь, что специализированный handler и общий fallback не показывают
два уведомления для одного сообщения.
