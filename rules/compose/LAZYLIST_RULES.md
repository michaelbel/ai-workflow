# LazyList Rules

- Use the project's `Shared*` component wrapper instead of a direct framework component when such a wrapper exists in the project.
- Pass `innerPadding` from `Scaffold` into `contentPadding`, not as `Modifier.padding`; combine with additional offsets using the `+` operator: `contentPadding = innerPadding + PaddingValues(bottom = 72.dp)`.
- Use `Arrangement.spacedBy()` for uniform spacing between homogeneous list items; do not insert `Spacer` between every item.
- Use an explicit `Spacer` only at the end of a list to create a gap below the last item (e.g. space under a floating action button).
- Do not add blank lines between adjacent `item {}` blocks.
- Never add horizontal padding to individual list items when all items share the same padding; put it in `contentPadding` with `PaddingValues(horizontal = 16.dp)` instead.
