# Room Rules

- In DAO interfaces, place all regular `fun` methods before any `suspend fun` methods.
- When changing Room database tables or entities, always increment `AppDatabase.DATABASE_VERSION`.
- In `@Dao` interfaces, annotate methods that return Pojo types with `@Transaction` to ensure consistent multi-table reads.
