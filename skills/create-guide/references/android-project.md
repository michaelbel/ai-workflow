# Android Project Rules

## Основа

Создавай проект из актуальной основной ветки:

<https://github.com/michaelbel/MyApplication>

Не копируй Android-шаблон внутрь этого skill. Перед каждым новым гайдом проверяй текущую структуру и версии `MyApplication`.

По умолчанию наследуй:

- Gradle Kotlin DSL;
- version catalog;
- JDK 21;
- Compose;
- edge-to-edge;
- тему и launcher resources;
- CI;
- подпись debug-сборки;
- `org.michaelbel` как package prefix.

Меняй унаследованное значение только тогда, когда тема требует этого. Причину фиксируй в манифесте.

## Тип проекта

### `catalog`

Используй для компонентов или API с несколькими независимыми вариантами.

```text
app/src/main/kotlin/org/michaelbel/<topic>/
├── MainActivity.kt
├── MainActivityContent.kt
├── Theme.kt
├── sample01_<Name>/Sample01App.kt
├── sample02_<Name>/Sample02App.kt
└── ...
```

Правила:

- номер всегда двузначный;
- один sample демонстрирует одну идею;
- главный экран (Home) содержит каталог samples и живёт в `MainActivityContent.kt`;
- порядок каталога и README совпадает; Notion описывает API без отдельного списка samples;
- не объединяй разные параметры в один гигантский sample без причины.

#### Навигация и главный экран (эталон: `ListItem`, `Insets`, `NavigationSuiteScaffold`, `EyeDropper`)

`MainActivity.kt` остаётся тонким:

```kotlin
class MainActivity: ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { AppTheme { MainActivityContent() } }
    }
}
```

`MainActivityContent.kt` строит навигацию через Navigation 3 (`androidx.navigation3:navigation3-runtime`, `androidx.navigation3:navigation3-ui`):

- backstack — `remember { mutableStateListOf<Any>(Home) }`, где `Home` и `SampleNN` — приватные `data object` для каждого маршрута;
- `NavDisplay(backStack, onBack = { backStack.removeLastOrNull() }, ...)` с `entryProvider`;
- `popTransitionSpec` и `predictivePopTransitionSpec` — `fadeIn() togetherWith fadeOut() using SizeTransform(clip = false)`;
- `entry<Home> { ... }` рендерит каталог samples, `entry<SampleNN> { SampleNNApp() }` — сам sample.

Экран Home — `Scaffold` с `TopAppBar` (заголовок — название темы или `stringResource(R.string.app_name)`), `pinnedScrollBehavior()` + `Modifier.nestedScroll(...)`, и `LazyColumn` со списком samples:

- `contentPadding`: 16.dp по горизонтали и сверху, снизу — `WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()`;
- `verticalArrangement = Arrangement.spacedBy(ListItemDefaults.SegmentedGap)`;
- каждый sample — `SegmentedListItem` с `overlineContent = { Text("Sample NN") }`, `shapes = ListItemDefaults.segmentedShapes(index, count)`, `colors = ListItemDefaults.segmentedColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHighest)`, `content = { Text("<Sample title>") }`; при необходимости добавляй `supportingContent` с коротким пояснением;
- связанные samples группируй в один сегмент (общий `count`), между несвязанными группами вставляй `Spacer(Modifier.height(12.dp))`;
- единственный несвязанный пункт без группы — обычный `ListItem`, а не `SegmentedListItem`.

Это требует Navigation 3 и версии `androidx.compose.material3` с `SegmentedListItem`/`ListItemDefaults.segmentedShapes` (см. текущие версии в `ListItem`/`Insets`/`EyeDropper`/`NavigationSuiteScaffold`) — фиксируй точную версию в манифесте, если она новее унаследованной из `MyApplication`. Добавление `androidx.navigation3` и обновление `material3` ради этой структуры не считается нарушением правила «не добавляй зависимости без необходимости»: это часть обязательной структуры каталога, а не тема гайда.

### `scenario`

Используй для API, смысл которого раскрывается в связанном потоке: Navigation, Paging, Room, WorkManager, архитектура.

Структура минимальная и зависит от сценария. Разрешены `feature`, `navigation`, `data` и другие слои только при реальной необходимости.

### `single`

Используй для одного небольшого API. Не создавай каталог с единственным пунктом.

## Минимальная архитектура

Учебный проект демонстрирует тему, а не количество слоёв.

Не добавляй без необходимости:

- DI-фреймворк;
- use case без бизнес-логики;
- интерфейс с одной реализацией;
- data/domain разделение для статических данных;
- многомодульность;
- сеть, Room или WorkManager;
- wrapper только ради переименования API.

Допускай локальное дублирование между samples, если оно делает каждый пример самостоятельным и читаемым.

## Код

- Следуй актуальным правилам `michaelbel/ai-workflow`.
- Не используй wildcard imports.
- Все примеры должны компилироваться.
- Experimental opt-in размещай на уровне файла.
- Для UI-направлений используй `start`/`end`, если API предоставляет эти понятия.
- Не оставляй комментарии, пересказывающие строку кода.
- Preview добавляй по правилам `ai-workflow`; для полноэкранного sample допускается preview корневого контента.
- Навигация каталога samples не должна затмевать изучаемый API.

## Версии

По умолчанию наследуй версии из `MyApplication`, затем добавляй только зависимости темы. Для alpha или experimental API фиксируй точную версию и opt-in в манифесте, README и Notion.
