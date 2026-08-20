---
name: create-nav-route
description: >-
  Use when пользователь просит добавить маршрут Navigation 3, `NavKey`, или подключить экран к
  nav-графу, или говорит "add a route", "create a navigation route", "add this screen to
  navigation". Покрывает файл маршрута `NavKey` (`data object`/`data class`) в
  `features/{feature}/navigation` и его регистрацию через `entry<...>`. Не используй это, чтобы
  создать сам экран или ViewModel; используй вместо этого create-feature-scaffold-screen и добавь
  маршрут рядом с ним.
metadata:
  author: michaelbel
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
