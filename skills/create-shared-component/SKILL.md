---
name: create-shared-component
description: >-
  Use when пользователь просит создать переиспользуемый Compose UI-компонент для
  `shared/ui/components`, или говорит "create a shared component", "add a reusable component", "new
  UI component". Покрывает data class `{Component}State`, composable, принимающий
  `state`/`modifier`, и его `PreviewParameterProvider`. Не используй для полного экрана,
  привязанного к ViewModel; используй вместо этого create-feature-scaffold-screen. Не используй для
  диалога или bottom sheet; используй вместо этого create-feature-alert-dialog или
  create-feature-bottom-sheet, поскольку у них свои конвенции state/lifecycle.
metadata:
  author: michaelbel
---

# Новый общий компонент

Создаёт переиспользуемый общий UI-компонент с State-холдером, preview и PreviewParameterProvider.
Замени `{Component}` на имя компонента (например, `PaymentBox`, `LoyaltyCardBox`), а `{package}`
на целевой пакет.

Один файл на компонент. Размещай его в `shared/ui/components` или отдельной подпапке там.

---

## {Component}.kt

```kotlin
package {package}

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewWrapper

data class {Component}State(
    val title: String,
    val onClick: () -> Unit
)

@Composable
fun {Component}(
    state: {Component}State,
    modifier: Modifier = Modifier
) {
    // component content
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Component}Preview(
    @PreviewParameter({Component}StateProvider::class) state: {Component}State
) {
    {Component}(state = state)
}

private class {Component}StateProvider: PreviewParameterProvider<{Component}State> {
    override val values: Sequence<{Component}State> = sequenceOf(
        {Component}State(
            title = "Example",
            onClick = {}
        )
    )
}
```

Правила:
- State — это `data class` с именем `{Component}State`; он хранит все данные и callback, нужные
  компоненту.
- Если компоненту нужно больше одного поля данных или callback, эти поля должны быть размещены в
  `{Component}State` в том же файле, а не переданы как отдельные параметры composable.
- Composable компонента принимает `state` первым параметром, `modifier` вторым со значением по
  умолчанию `Modifier`.
- Preview вызывает компонент напрямую — никогда не ViewModel или экран.
- Используй `@PreviewWrapper(ThemeWrapper::class) @Preview` для preview.
- Создавай только одну функцию preview на файл компонента и представляй все варианты preview через
  `PreviewParameterProvider`.
- Создавай приватный `{Component}StateProvider: PreviewParameterProvider<{Component}State>` в том
  же файле всякий раз, когда используется `{Component}State`.
- Каждый компонент находится в своём файле; не объявляй несколько компонентов в одном файле.
