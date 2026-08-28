---
description: >-
  Регресс-гард доступности устройств: aapt2 dump badging в golden-файл app/badging, обязательный
  check<Variant>Badging в CI, необязательное железо через android:required=false
paths:
  - "**/*.gradle.kts"
  - "**/AndroidManifest.xml"
---

`aapt2 dump badging` по собранному APK показывает эффективный набор `uses-feature` /
`uses-permission` / `uses-sdk` — то, из-за чего Google Play скрывает приложение на планшетах,
Android TV, Wear OS, складных устройствах и авто. Обновление зависимости может молча добавить
`android:required` hardware feature (камера, телефония, автофокус) и срезать доступность, а в
диффе исходников этого не видно. Гард фиксирует бейдж в golden-файл и валит CI при расхождении.

## Что заводится в проекте

- Convention-плагин `build-logic/`, который на каждый application-вариант регистрирует три задачи:
  - `generate<Variant>Badging` — `aapt2 dump badging` по универсальному APK варианта → генерируемый
    файл в `build/`.
  - `update<Variant>Badging` — копирует генерируемый файл в golden `app/badging/<variant>.txt`
    (запускается локально, результат коммитится и проходит ревью).
  - `check<Variant>Badging` — сравнивает генерируемый с golden; при расхождении фейлит с диффом.
- Golden-файлы `app/badging/*.txt` — под контролем версий; изменение бейджа всегда осознанное и
  видно в PR.

## Правила

- `check<Variant>Badging` (как минимум для release-варианта) — обязательный шаг CI на каждый PR.
- Изменение `app/badging/*.txt` в PR без соответствующей причины (новая фича, осознанное
  требование к железу) — стоп-фактор ревью.
- Все `uses-feature` для необязательного железа объявляй с `android:required="false"`; жёсткое
  требование железа — только когда приложение без него нефункционально.
- Не добавляй `check*Badging` в `dependsOn` обычной сборки — это отдельный verification-шаг, чтобы
  не замедлять локальный цикл.

## Скелет convention-плагина

```kotlin
// build-logic/convention/src/main/kotlin/AndroidApplicationBadgingConventionPlugin.kt
import com.android.build.api.artifact.SingleArtifact
import com.android.build.api.variant.ApplicationAndroidComponentsExtension
import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.CacheableTask
import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction
import org.gradle.kotlin.dsl.register

class AndroidApplicationBadgingConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) {
        val components = target.extensions
            .getByType(ApplicationAndroidComponentsExtension::class.java)

        components.onVariants { variant ->
            val capitalised = variant.name.replaceFirstChar { it.uppercaseChar() }
            val golden = target.rootDir.resolve("app/badging/${variant.name}.txt")
            val generated = target.layout.buildDirectory.file("badging/${variant.name}.txt")
            val apk = variant.artifacts.get(SingleArtifact.APK)

            val generate = target.tasks.register<GenerateBadgingTask>("generate${capitalised}Badging") {
                apkDir.set(apk)
                aapt2.set(resolveAapt2(target))
                output.set(generated)
            }

            target.tasks.register<Copy>("update${capitalised}Badging") {
                group = "badging"
                description = "Обновляет app/badging/${variant.name}.txt — закоммить результат"
                dependsOn(generate)
                from(generated)
                into(golden.parentFile.also { it.mkdirs() })
                rename { golden.name }
            }

            target.tasks.register<CheckBadgingTask>("check${capitalised}Badging") {
                group = "verification"
                description = "Фейлит, если требуемые фичи ${variant.name}-APK разошлись с golden-файлом"
                dependsOn(generate)
                generated.set(generated)
                this.golden.set(golden)
            }
        }
    }
}

@CacheableTask
abstract class GenerateBadgingTask : DefaultTask() {
    @get:InputFile @get:PathSensitive(PathSensitivity.NONE)
    abstract val apkDir: RegularFileProperty

    @get:org.gradle.api.tasks.Input
    abstract val aapt2: Property<String>

    @get:OutputFile
    abstract val output: RegularFileProperty

    @TaskAction
    fun run() {
        val apk = apkDir.get().asFile.parentFile
            .listFiles { f -> f.extension == "apk" }?.firstOrNull()
            ?: error("APK не найден в ${apkDir.get().asFile.parentFile}")
        val out = output.get().asFile.also { it.parentFile.mkdirs() }
        project.exec {
            commandLine(aapt2.get(), "dump", "badging", apk.absolutePath)
            standardOutput = out.outputStream()
        }
    }
}

@CacheableTask
abstract class CheckBadgingTask : DefaultTask() {
    @get:InputFile @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val generated: RegularFileProperty

    @get:InputFile @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val golden: RegularFileProperty

    @TaskAction
    fun run() {
        val g = generated.get().asFile.readText()
        val expected = golden.get().asFile.let {
            if (!it.exists()) error("Нет golden-файла ${it.path} — запусти update…Badging и закоммить")
            it.readText()
        }
        if (g.trim() != expected.trim()) {
            error(
                "Бейдж APK разошёлся с golden-файлом ${golden.get().asFile.path}.\n" +
                    "Если изменение осознанное — запусти ./gradlew update…Badging и закоммить новый golden."
            )
        }
    }
}

private fun resolveAapt2(project: Project): String {
    val android = project.extensions
        .getByType(com.android.build.gradle.BaseExtension::class.java)
    return android.sdkDirectory
        .resolve("build-tools/${android.buildToolsVersion}/aapt2")
        .absolutePath
}
```

## CI

```yaml
# .github/workflows/pr-check.yml (фрагмент)
      - name: App badging check
        run: ./gradlew checkReleaseBadging
```

## Как выглядит golden-файл

```
# app/badging/release.txt
package: name='com.example.app' versionCode='142' versionName='1.4.2'
sdkVersion:'26'
targetSdkVersion:'35'
uses-permission: name='android.permission.INTERNET'
uses-feature-not-required: name='android.hardware.camera'
feature-group: label=''
  uses-feature: name='android.hardware.faketouch'
```
