---
description: >-
  Порядок ограничений в constrainAs (width, height, start, top, end, bottom) и размеры через API
  Dimension вместо внешних modifier
paths:
  - "**/*.gradle.kts"
  - "**/AndroidManifest.xml"
  - "**/*.kt"
---

- В блоке `constrainAs` упорядочивай присваивания ограничений так: `width`, `height`, `start`,
  `top`, `end`, `bottom`.
- Когда composable позиционируется через `constrainAs`, объявляй его размер внутри блока
  `constrainAs`, используя API `Dimension` (`Dimension.value(...)`, `Dimension.fillToConstraints`,
  `Dimension.wrapContent`), вместо модификаторов размера во внешней цепочке modifier.
- Называй refs ConstraintLayout, созданные через `createRef` или `createRefs`, с постфиксом `Ref`;
  это применимо как к одиночным refs, так и к каждому компоненту деструктурированного объявления
  `createRefs()`.
