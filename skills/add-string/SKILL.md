---
name: add-string
description: >-
  Use when пользователь просит добавить, подключить или сослаться на строковый или plural-ресурс UI
  в Android/Kotlin-проекте, или говорит "add a string", "add this text", "add a plural", "hardcoded
  string", "add to strings.xml". Добавляет запись в strings.xml и открывает её через строковый фасад
  проекта, чтобы UI-код никогда не обращался к R.string/R.plurals напрямую. Не используй это, чтобы
  построить экран, диалог или компонент, который будет отображать строку; для окружающего UI
  используй create-feature-scaffold-screen, create-feature-alert-dialog, create-feature-bottom-sheet
  или create-shared-component, а в этот скилл возвращайся только за самим строковым ресурсом.
metadata:
  author: michaelbel
---

# Добавление строки

Добавляет строковый ресурс UI в проект.

Правила:
- Добавь строку в `app/src/main/res/values/strings.xml`.
- Предоставь доступ к ней через файл-фасад строк проекта.
- UI-код обращается к фасаду строк, а не напрямую к `R.string` или `R.plurals`.
- Для текста UI в верхнем регистре добавляйте отдельный строковый ресурс в верхнем регистре и
  запись в фасаде строк; не вызывай `uppercase()`.
- Сохраняй именование с префиксом фичи: `{feature}_{meaning}`, предоставляется как
  `{Feature}{Meaning}` в фасаде строк.
- Множественные формы (`plurals`) также добавляй в `strings.xml` и предоставляй доступ через фасад
  строк; указывай только те `item quantity="..."`, которые нужны для конкретного языка (например,
  для русского — `one`, `few`, `many`, `other`, без `zero` и `two`).

Пример:

```xml
<string name="cart_select_size_caps">ВЫБРАТЬ РАЗМЕР</string>

<plurals name="cart_items_count">
    <item quantity="one">%d товар</item>
    <item quantity="few">%d товара</item>
    <item quantity="many">%d товаров</item>
    <item quantity="other">%d товара</item>
</plurals>
```

```kotlin
val CartSelectSizeCaps = R.string.cart_select_size_caps
val CartItemsCount = R.plurals.cart_items_count
```
