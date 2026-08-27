---
paths:
  - "**/*.kt"
---

# Правила сети

- Имена классов моделей запросов должны заканчиваться на `Request`.
- Имена классов моделей ответов должны заканчиваться на `Response`.
- Каждая модель запроса и ответа должна быть аннотирована `@Serializable`, а каждое поле должно
  иметь аннотацию `@SerialName`.
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
- Используй `handleResponse` для сетевых вызовов, обрабатываемых через callback, и
  `handleResponseResult(...).getOrThrow()`, когда сетевой ответ нужно потребить как значение внутри
  `execute`; если failure нужно преобразовать в endpoint-specific exception, используй
  `getOrElse`, пробрось `CancellationException` и выбрось конкретное исключение. Не оборачивай
  результаты use case вручную в `Result.success` / `Result.failure`.
- При вызове `handleResponse` всегда передавай все три именованных аргумента: `request`, `onSuccess`
  и `onFailure`; в `onFailure` создавай отдельный `data class`-исключение, наследующее базовое
  сетевое исключение проекта, и выбрасывай его; перехватывай этот конкретный тип исключения в
  функции `catch` ViewModel.
