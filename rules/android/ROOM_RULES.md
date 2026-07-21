# Room Rules

- In DAO interfaces, place all regular `fun` methods before any `suspend fun` methods.
- When changing Room database tables or entities, always increment `AppDatabase.DATABASE_VERSION`.
- For Room entities, declare primary keys in the `@Entity(primaryKeys = [...])` parameter instead of using `@PrimaryKey` on a property.
- In `@Dao` interfaces, annotate methods that return Pojo types with `@Transaction` to ensure consistent multi-table reads.
- Use `AppDatabase.withTransaction` only when the transaction block contains two or more DAO/database method calls; do not wrap a single method call in `withTransaction`.
- For single-row Room reads, expose both nullable `select` and non-null `selectNotNull` formats when both call sites exist:
  ```kotlin
  @Query("SELECT * FROM EntityTable WHERE id = :id LIMIT 1")
  suspend fun select(id: Int): Entity?

  @Query("SELECT * FROM EntityTable WHERE id = :id LIMIT 1")
  suspend fun selectNotNull(id: Int): Entity
  ```
- Use `select` when the row may be absent; use `selectNotNull` only when the caller definitely knows the value exists in the database.
- Do not write `@Transaction` DAO methods that orchestrate multiple other DAO methods, for example a `replace` method that calls `delete()` then `upsert(entity)`; keep DAO methods as single declarative `@Query`/`@Insert`/`@Upsert`/`@Delete` operations and combine multiple DAO calls with `AppDatabase.withTransaction` in the use case layer instead.
