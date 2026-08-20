---
name: add-string
description: >-
  Use when the user asks to add, wire up, or reference a UI string or plural resource in an
  Android/Kotlin project, or says "add a string", "add this text", "add a plural", "hardcoded
  string", "add to strings.xml". Adds the entry to strings.xml and exposes it through the
  project's string facade so UI code never references R.string/R.plurals directly. Do not use
  this to build the screen, dialog, or component that will display the string; use new-screen,
  new-alert-dialog, new-bottom-sheet, or new-shared-component for the surrounding UI and call
  back into this skill only for the string resource itself.
metadata:
  author: michaelbel
---

# Добавление строки

Добавляет строковый ресурс UI в проект.

Правила:
- Добавь строку в `app/src/main/res/values/strings.xml`.
- Предоставь доступ к ней через файл-фасад строк проекта.
- UI-код обращается к фасаду строк, а не напрямую к `R.string` или `R.plurals`.
- Для текста UI в верхнем регистре добавляйте отдельный строковый ресурс в верхнем регистре и запись в фасаде строк; не вызывай `uppercase()`.
- Сохраняй именование с префиксом фичи: `{feature}_{meaning}`, предоставляется как `{Feature}{Meaning}` в фасаде строк.
- Множественные формы (`plurals`) также добавляй в `strings.xml` и предоставляй доступ через фасад строк; указывай только те `item quantity="..."`, которые нужны для конкретного языка (например, для русского — `one`, `few`, `many`, `other`, без `zero` и `two`).

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
