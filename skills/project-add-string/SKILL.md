---
name: project-add-string
---

# Project Add String

Adds a UI string resource in the project.

Rules:
- Add the string to `app/src/main/res/values/strings.xml`.
- Expose it from the project's string facade file.
- UI code references the string facade, not `R.string` or `R.plurals` directly.
- For uppercase UI text, add a dedicated uppercase string resource and string-facade entry; do not call `uppercase()`.
- Keep naming feature-prefixed: `{feature}_{meaning}`, exposed as `{Feature}{Meaning}` in the string facade.

Example:

```xml
<string name="cart_select_size_caps">ВЫБРАТЬ РАЗМЕР</string>
```

```kotlin
val CartSelectSizeCaps get() = R.string.cart_select_size_caps
```
