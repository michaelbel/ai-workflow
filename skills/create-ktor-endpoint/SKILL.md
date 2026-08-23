---
name: create-ktor-endpoint
description: >-
  Use when пользователь просит добавить Ktor API endpoint, request/response-модели или настроить
  отдельный HttpClient для нового backend. Не используй для Room, mapper, use case, WebSocket или
  полного потока данных от API до UI.
metadata:
  author: michaelbel
---

# Создание Ktor endpoint

Сначала найди подходящий `NetworkService`, существующий `HttpClient`/qualifier и соседний endpoint.
Повторяй локальные соглашения авторизации, base URL, headers, query/path/body и обработки
`HttpResponse`; новый client создавай только когда существующий не подходит по backend или policy.

## Реализация

- Добавь метод в тематический `NetworkService` и используй точный HTTP method/path контракта.
- Создай только необходимые request/response-модели, каждую в отдельном файле.
- Имена моделей заканчивай на `Request` и `Response`.
- Аннотируй каждую API-модель `@Serializable`, а каждое сериализуемое поле — `@SerialName` с точным
  именем из wire-контракта.
- Выражай path/query/header/body/multipart явно и сохраняй nullable/optional семантику API; не
  подставляй domain defaults в transport-модель.
- Не добавляй mapper, Room-запись или `UseCase`, если они не входят в запрос пользователя.

Если нужен новый client, подключи его через существующий DI-подход и настрой только необходимые
base URL, JSON, authentication, timeout, logging/Chucker параметры. Не логируй токены и чувствительные
body.

Проверь компиляцию модуля и существующие mock/API contract tests; для нового endpoint добавь тест,
если в проекте уже используется MockEngine или аналогичный шаблон.
