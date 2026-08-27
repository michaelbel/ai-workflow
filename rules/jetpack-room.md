---
paths:
  - "**/*.kt"
---

# Правила Room

- В интерфейсах DAO размещай все обычные методы `fun` перед любыми методами `suspend fun`.
- При изменении таблиц или entity базы данных Room всегда увеличивай `AppDatabase.DATABASE_VERSION`.
- Для entity Room объявляй первичные ключи в параметре `@Entity(primaryKeys = [...])` вместо
  использования `@PrimaryKey` на свойстве.
- В интерфейсах `@Dao` помечай методы, возвращающие типы Pojo, аннотацией `@Transaction`, чтобы
  обеспечить согласованное чтение из нескольких таблиц.
- Используй `AppDatabase.withTransaction` только когда блок транзакции содержит два и более вызова
  методов DAO/базы данных; не оборачивай один вызов метода в `withTransaction`.
- Для чтения одной строки Room предоставляй как nullable `select`, так и non-null `selectNotNull`
  форматы, когда оба варианта использования существуют:
  ```kotlin
  @Query("SELECT * FROM EntityTable WHERE id = :id LIMIT 1")
  suspend fun select(id: Int): Entity?

  @Query("SELECT * FROM EntityTable WHERE id = :id LIMIT 1")
  suspend fun selectNotNull(id: Int): Entity
  ```
- Используй `select`, когда строка может отсутствовать; используй `selectNotNull` только когда
  вызывающий код точно знает, что значение существует в базе данных.
- Не пиши методы DAO с `@Transaction`, которые оркестрируют несколько других методов DAO, например
  метод `replace`, вызывающий `delete()`, а затем `upsert(entity)`; держи методы DAO как отдельные
  декларативные операции `@Query`/`@Insert`/`@Upsert`/`@Delete` и комбинируй несколько вызовов DAO
  через `AppDatabase.withTransaction` на уровне use case.
