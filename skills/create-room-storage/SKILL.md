---
name: create-room-storage
description: >-
  Use when пользователь просит добавить или изменить законченную единицу Room-хранилища: entity,
  DAO, Pojo/relations, регистрацию в AppDatabase, version и migration. Не используй для сетевого
  endpoint, mapper, use case или полного data flow; выбирай соответствующий отдельный skill.
metadata:
  author: michaelbel
---

# Создание Room-хранилища

Сначала изучи существующие `AppDatabase`, DAO, entity, migrations и соглашения имён таблиц в
целевом проекте. Сохраняй их стиль и меняй только части схемы, нужные задаче.

## Результат

- Создай по одному файлу на `Entity` и Pojo-модель.
- Создай или расширь один тематический `@Dao` с нужными `Flow`- и suspend-операциями.
- Зарегистрируй entity и DAO в `AppDatabase`.
- При любом изменении таблицы/entity увеличь `DATABASE_VERSION` и добавь migration, если проект не
  использует явно destructive/schema-managed стратегию.
- Обнови schema fixtures/exported schema, если они отслеживаются проектом.

## Инварианты

- Объявляй ключи в `@Entity(primaryKeys = [...])`; не используй `@PrimaryKey` на свойствах.
- Располагай обычные `fun`, включая методы с `Flow`, перед `suspend fun`.
- Для flow без параметров предпочитай существующую в проекте форму `@get:Query val`; для flow с
  параметрами используй функцию.
- Добавляй `@Transaction` методам, возвращающим Pojo с отношениями.
- Предоставляй nullable `select` и отдельный `selectNotNull`, только когда оба контракта реально
  нужны вызывающему коду.
- Не создавай DAO-метод, который императивно вызывает другие DAO-методы. Несколько записей собирай
  через `AppDatabase.withTransaction` в use case; один DAO-вызов транзакцией не оборачивай.
- Выбирай `@Upsert`, `@Insert`, `@Update` или `@Delete` по требуемой конфликтной семантике, а не
  автоматически.

Проверь компиляцию Room/KSP целевого модуля и migration/schema-тесты, если они есть.
