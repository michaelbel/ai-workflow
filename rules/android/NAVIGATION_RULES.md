# Navigation Rules

- Every screen route is a `@Serializable data class` or `@Serializable data object` that implements `NavKey`.
- Routes live in `features/{feature}/navigation`.
- Use `data object {Feature}Route: NavKey` for screens without arguments.
- Use `data class {Feature}Route(...): NavKey` for screens with arguments.
- ViewModels retrieve route arguments via `savedStateHandle.toRoute<{Feature}Route>()`.
- Register routes in the project's navigation display wrapper with `entry<{Feature}Route> { {Feature}Screen(it) }` when the route has arguments, or `entry<{Feature}Route> { {Feature}Screen() }` when it does not.
- Back navigation uses a separate `@Serializable data object BackRoute: NavKey`.
