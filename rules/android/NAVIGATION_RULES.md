# Navigation Rules

- Every screen route is a `@Serializable data class` or `@Serializable data object` that implements `NavKey`.
- Route classes live in a dedicated `navigation/` subpackage inside the feature package.
- ViewModels retrieve route arguments via `savedStateHandle.toRoute<{Feature}Route>()`.
- Back navigation uses a separate `@Serializable data object BackRoute: NavKey`.
