---
paths:
  - "**/*.gradle.kts"
  - "**/*.kt"
---

# Правила корутин

- Не используй `GlobalScope`; запускай корутины только в scope с определённым жизненным циклом
  (переданный `CoroutineScope`, scope MVI-стора).
- Не хардкодь `Dispatchers.IO`/`Dispatchers.Default`/`Dispatchers.Main` внутри классов; принимай
  `CoroutineDispatcher` параметром конструктора, чтобы тест подставлял `TestDispatcher`.
- В ветках `when` не ставь `launch` сразу после `->`; оборачивай тело ветки в фигурные скобки и
  вызывай `launch { ... }` внутри блока ветки, даже если `launch` — единственная инструкция.
