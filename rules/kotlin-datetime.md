---
description: >-
  Передача Duration в delay вместо Long-значения миллисекунд: delay(CONSTANT.milliseconds)
paths:
  - "**/*.kt"
---

- Не передавай в `delay()` «сырое» `Long`-значение миллисекунд (константу вроде
  `MESSENGER_POLLING_INTERVAL_MILLIS`, литерал или результат вычисления); оборачивай его в
  `Duration` через extension-свойство: `delay(MESSENGER_POLLING_INTERVAL_MILLIS.milliseconds)`.
