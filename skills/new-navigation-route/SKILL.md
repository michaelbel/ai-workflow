---
name: new-navigation-route
description: >-
  Use when the user asks to add a Navigation 3 route, a `NavKey`, or wire a screen into the nav
  graph, or says "add a route", "create a navigation route", "add this screen to navigation".
  Covers the `data object`/`data class` `NavKey` route file under `features/{feature}/navigation`
  and registering it with `entry<...>`. Do not use this to create the screen or ViewModel itself;
  use new-screen instead and add the route alongside it.
---

# Новый маршрут навигации

Создаёт маршрут Navigation 3 для проекта.

Правила:
- Размещай файлы маршрутов в `features/{feature}/navigation`.
- Каждый маршрут — это `@Serializable` и реализует `NavKey`.
- Используй `data object` для маршрутов без аргументов.
- Используй `data class` для маршрутов с аргументами.
- Добавляй маршрут в соответствующий провайдер записей навигационного отображения.

Маршрут без аргументов:

```kotlin
package {package}.features.{feature}.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object {Feature}Route: NavKey
```

Маршрут с аргументом:

```kotlin
@Serializable
data class {Feature}Route(
    val id: String
): NavKey
```
