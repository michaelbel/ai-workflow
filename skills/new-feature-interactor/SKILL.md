---
name: new-feature-interactor
---

# New Feature Interactor

Creates the domain interactor layer for a new feature: Interactor interface, InteractorImpl, and Hilt binding. Replace `{Feature}` with the domain name and `{package}` with the target package.

Two files must be created, plus one existing file updated.

---

## {Feature}Interactor.kt

```kotlin
package {package}.interactor

import kotlinx.coroutines.flow.Flow

interface {Feature}Interactor {

    fun {feature}EntitiesFlow(): Flow<List<{Feature}Entity>>

    suspend fun load{Feature}Result(): Result<Unit>
}
```

Rules:
- The interface mirrors the Repository interface exactly; the Interactor is a thin dispatcher layer.
- Flow methods are not `suspend`.

---

## {Feature}InteractorImpl.kt

```kotlin
package {package}.interactor.impl

import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import {package}.interactor.{Feature}Interactor
import {package}.repository.{Feature}Repository

class {Feature}InteractorImpl @Inject constructor(
    private val dispatchers: CourierDispatchers,
    private val {feature}Repository: {Feature}Repository
): {Feature}Interactor {

    override fun {feature}EntitiesFlow(): Flow<List<{Feature}Entity>> {
        return {feature}Repository.{feature}EntitiesFlow()
    }

    override suspend fun load{Feature}Result(): Result<Unit> {
        return withContext(dispatchers.io) { {feature}Repository.load{Feature}Result() }
    }
}
```

Rules:
- Flow methods delegate directly without `withContext` — they return cold flows.
- Every `suspend` method wraps the repository call in `withContext(dispatchers.io)`.
- No business logic here; all logic belongs in the repository or a use case.

---

## InteractorModule.kt (update existing)

Add a binding to the existing `InteractorModule`:

```kotlin
@Binds
fun {feature}Interactor(impl: {Feature}InteractorImpl): {Feature}Interactor
```

Also add the new interactor to the feature's facade `Interactor` class:

```kotlin
class Interactor @Inject constructor(
    ...,
    {feature}Interactor: {Feature}Interactor
): ...,
   {Feature}Interactor by {feature}Interactor
```
