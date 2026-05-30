# Project Navigation Rules

- Routes live in `features/{feature}/navigation`.
- Every route is `@Serializable` and implements `NavKey`.
- Use `data object {Feature}Route: NavKey` for screens without arguments.
- Use `data class {Feature}Route(...): NavKey` for screens with arguments.
- Register routes in the project's navigation display wrapper with `entry<{Feature}Route> { {Feature}Screen(it) }` when the route has arguments, or `entry<{Feature}Route> { {Feature}Screen() }` when it does not.
