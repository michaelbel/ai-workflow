---
description: >-
  Маршруты как @Serializable data class или data object реализующие NavKey в
  features/{feature}/navigation, аргументы через savedStateHandle.toRoute
paths:
  - "**/*.kt"
---

- Каждый маршрут экрана — это `@Serializable data class` или `@Serializable data object`,
  реализующий `NavKey`.
- Маршруты находятся в `features/{feature}/navigation`.
- Используй `data object {Feature}Route: NavKey` для экранов без аргументов.
- Используй `data class {Feature}Route(...): NavKey` для экранов с аргументами.
- ViewModel-и получают аргументы маршрута через `savedStateHandle.toRoute<{Feature}Route>()`.
- Регистрируй маршруты в навигационной обёртке отображения проекта через
  `entry<{Feature}Route> { {Feature}Screen(it) }`, когда у маршрута есть аргументы, или
  `entry<{Feature}Route> { {Feature}Screen() }`, когда их нет.
- Для навигации назад используй отдельный `@Serializable data object BackRoute: NavKey`.
