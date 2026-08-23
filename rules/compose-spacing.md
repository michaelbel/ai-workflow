# Правила отступов и размеров Compose

- Для `padding(...)` и `PaddingValues(...)` упорядочивай именованные параметры согласно сигнатуре
  метода: `start`, `top`, `end`, `bottom`; либо при использовании сокращённой формы — `horizontal`,
  `vertical`.
- Опускай именованные аргументы `padding(...)` или `PaddingValues(...)`, равные `0.dp`; неуказанные
  измерения padding по умолчанию равны `0.dp`.
- Когда padding симметричен, используй `all`, `horizontal` или `vertical` вместо повторения
  одинаковых значений для противоположных сторон.
- Используй `PaddingValues()` вместо `PaddingValues(0.dp)` — все измерения по умолчанию равны
  `0.dp`.
- Когда первый и последний дочерние элементы `Row` или `Column` имеют одинаковый крайний padding,
  переноси его в родительский контейнер через `padding(horizontal = ...)` или
  `padding(vertical = ...)`.
- Для `Modifier.offset(...)`, зависящего от state, используй lambda-перегрузку:
  `Modifier.offset { ... }`.
- Для `floatingActionButton` размещай кнопку прямо в слоте и применяй padding к modifier кнопки; не
  оборачивай её в `Box` только ради полной ширины, отступа под навигационную панель или
  горизонтального padding.
- Используй `Modifier.size(width = ..., height = ...)` вместо цепочки
  `Modifier.width(...).height(...)`.
- Когда по дизайну текст должен быть вертикально центрирован в области фиксированной высоты,
  применяй модификаторы ширины, высоты и padding напрямую к `Text`, затем используй
  `Modifier.wrapContentHeight(align = Alignment.CenterVertically)`; не оборачивай `Text` в `Box`
  фиксированной высоты только ради вертикального выравнивания.
- Заменяй одинаковые по размеру элементы `Spacer` между дочерними элементами `Row` или `Column` на
  `horizontalArrangement = Arrangement.spacedBy(...)` или
  `verticalArrangement = Arrangement.spacedBy(...)`.
- Когда центрированному `Column` нужны равномерные отступы между дочерними элементами, используй
  `verticalArrangement = Arrangement.spacedBy(..., Alignment.CenterVertically)` вместо добавления
  верхнего padding отдельным дочерним элементам.
