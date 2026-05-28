# Interactor Rules

- Every `suspend` method in an InteractorImpl wraps the repository call in `withContext(dispatchers.io)`.
- Flow-returning methods delegate to the repository directly without `withContext` — they return cold flows.
- Interactors contain no business logic; all logic belongs in the repository or a dedicated use case.
- Bind each interactor in `InteractorModule` with `@Binds`.
- Each feature module has a facade `Interactor` class that aggregates all domain interactor interfaces via `by` delegation; inject this facade into ViewModels instead of individual interactors.
