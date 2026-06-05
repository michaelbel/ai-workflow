---
name: new-navigation-route
---

# New Navigation Route

Creates a Navigation 3 route for the project.

Rules:
- Put route files in `features/{feature}/navigation`.
- Every route is `@Serializable` and implements `NavKey`.
- Use `data object` for routes without arguments.
- Use `data class` for routes with arguments.
- Add the route to the correct navigation display entry provider.

No-argument route:

```kotlin
package {package}.features.{feature}.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object {Feature}Route: NavKey
```

Argument route:

```kotlin
@Serializable
data class {Feature}Route(
    val id: String
): NavKey
```
