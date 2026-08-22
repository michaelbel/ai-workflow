---
name: create-shared-component
description: >-
  Use when пользователь просит создать переиспользуемый Compose UI-компонент для
  `shared/ui/components`, или говорит "create a shared component", "add a reusable component", "new
  UI component". Строит либо простой composable с обычными типизированными параметрами (для
  универсальных layout-примитивов), либо composable с `{Component}State`-холдером (для компонентов
  конкретной предметной области, просто вынесенных в отдельный файл), плюс его preview. Не используй
  для диалога; используй вместо этого
  [create-feature-alert-dialog](../create-feature-alert-dialog/SKILL.md). Не используй для bottom
  sheet; используй вместо этого
  [create-feature-bottom-sheet](../create-feature-bottom-sheet/SKILL.md). Не используй для полного
  экрана, привязанного к ViewModel; используй вместо этого
  [create-feature-scaffold-screen](../create-feature-scaffold-screen/SKILL.md).
metadata:
  author: michaelbel
---

# Новый общий компонент

Требует зависимость `androidx.compose.foundation`.

Создаёт переиспользуемый Compose-компонент проекта. Замени `{Component}` на имя компонента
(например, `SharedCard`, `BarcodeFrameBox`), а `{package}` на целевой пакет.

## Фаза 1: разместить файл компонента

Один файл на компонент — `{Component}.kt`. Размещай его прямо в `shared/ui/components`, если это
универсальный layout-примитив или обёртка (как `SharedRow`, `SharedColumn`); для компонента
конкретной предметной области создавай тематическую подпапку, например `shared/ui/components/scan`.

## Фаза 2: выбери форму компонента

- Универсальный layout-примитив или обёртка, не завязанная на конкретную предметную область (как
  `SharedRow`, `SharedColumn`) — без State, обычные параметры.
- Компонент, который не такой общий, а просто вынесен в отдельный файл и представляет конкретный
  предметный смысл (иконка-пресет, карточка определённого содержимого и т. д.) — с
  `{Component}State` наверху файла.

## Универсальный примитив (без State)

```kotlin
package {package}

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun {Component}(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    // component content
}

@Preview(showBackground = true)
@Composable
private fun {Component}Preview() {
    {Component}(
        title = "Example",
        onClick = {}
    )
}
```

## Компонент с State

Наверху файла размести `{Component}State` — `data class`, если данные варьируются свободно, или
`sealed class` с несколькими `data object`-вариантами, если у компонента всего пара
фиксированных пресетов. Сам компонент принимает один параметр `state`; `modifier` добавляй вторым
параметром, только если он реально нужен.

```kotlin
package {package}

// Добавь все необходимые импорты

sealed class {Component}State(
    val iconRes: Int,
    val iconModifier: Modifier
) {
    data object SampleA: {Component}State(
        iconRes = AppIcons.SampleA,
        iconModifier = Modifier.size(107.dp, 131.dp)
    )

    data object SampleB: {Component}State(
        iconRes = AppIcons.SampleB,
        iconModifier = Modifier.size(164.dp, 164.dp)
    )
}

@Composable
fun {Component}(
    state: {Component}State
) {
    Box(
        modifier = Modifier
            .size(192.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surface),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            painter = painterResource(state.iconRes),
            contentDescription = null,
            modifier = state.iconModifier,
            tint = Color.Unspecified
        )
    }
}

@PreviewWrapper(ThemeWrapper::class)
@Preview
@Composable
private fun {Component}Preview(
    @PreviewParameter({Component}StatePreviewParameterProvider::class) state: {Component}State
) {
    {Component}(
        state = state
    )
}

private class {Component}StatePreviewParameterProvider: PreviewParameterProvider<{Component}State> {
    override val values: Sequence<{Component}State> = sequenceOf(
        {Component}State.SampleA,
        {Component}State.SampleB
    )
}
```

Правила:
- Универсальный примитив принимает свои данные как обычные типизированные параметры — не
  оборачивай их в `{Component}State`, даже если параметров несколько.
- Компонент, который не такой общий, а просто вынесен в отдельный файл, оборачивает свои данные в
  `{Component}State` наверху того же файла и принимает единственный параметр `state`; `modifier`
  добавляй вторым параметром только при реальной необходимости.
- Порядок параметров универсального примитива: сначала обязательные (без значения по умолчанию),
  затем `modifier: Modifier = Modifier`, затем остальные параметры со значением по умолчанию, а
  завершающей идёт обязательная trailing-лямбда `content`, если компонент оборачивает содержимое
  (например `content: @Composable ColumnScope.() -> Unit`).
- Каждый компонент находится в своём файле; не объявляй несколько компонентов в одном файле.
- `@PreviewWrapper(ThemeWrapper::class)` используй только для компонента с `{Component}State` —
  ему нужна реальная тема приложения (иконки, цвета). Для универсального примитива без State
  preview — обычный `@Preview`, без `PreviewWrapper`.
- Указывай `showBackground = true`, только если у компонента нет собственного видимого фона —
  например `Text` или список на прозрачном фоне (`SharedRow`, `SharedColumn`,
  `SharedLazyColumn`). Если компонент сам рисует себе фон или форму (как `SharedDragHandle` или
  `{Component}` с State выше), `showBackground` не нужен.
- Не создавай preview вовсе, если статичный снимок ничего не покажет без реального взаимодействия
  или внешнего состояния — например обёртка видимости (`SharedAnimatedVisibility`), хост снекбара
  без активного снекбара (`SharedSnackbarHost`) или модальный bottom sheet.
- Для компонента с `{Component}State` всегда создавай приватный
  `{Component}StatePreviewParameterProvider: PreviewParameterProvider<{Component}State>` в том же
  файле. Для универсального примитива без State создавай `PreviewParameterProvider`, только если у
  компонента есть несколько содержательно разных состояний, которые стоит показать; иначе preview
  вызывает компонент напрямую с представительными литеральными значениями.
- Preview-функция всегда `private`.
