# LazyList Rules

- Pass `innerPadding` from `Scaffold` into `contentPadding`, not as `Modifier.padding`; combine with additional offsets using the `+` operator: `contentPadding = innerPadding + PaddingValues(bottom = 72.dp)`.
- Use `Arrangement.spacedBy()` for uniform spacing between homogeneous list items; do not insert `Spacer` between every item.
- Use an explicit `Spacer` only at the end of a list to create a gap below the last item (e.g. space under a floating action button).
- Use `items(...)` or `items(count = ...)` to render collections in lazy lists; do not loop with `forEachIndexed` and create separate `item {}` blocks for each element.
- Use raw stable ids as lazy item keys, for example `key = { item -> item.id }`; do not build string keys such as `"item-${item.id}"` when the id is already stable.
- When a list item needs its index, such as for detecting the last item, use `items(count = items.size, key = { index -> items[index].id })` and read `val item = items[index]` inside the item content.
- Detect the last lazy list item with `index != items.lastIndex`; do not compare item ids with `items.last().id`.
- Do not add blank lines between adjacent `item {}` blocks.
- Never add horizontal padding to individual list items when all items share the same padding; put it in `contentPadding` with `PaddingValues(horizontal = 16.dp)` instead.
- Render a screen's loading/content/error/empty states inside one lazy list; do not branch with `when`/`if` into separate lazy list instances per state. Put each state's items behind `if (state.isLoading) { ... }`, `if (state.isContentVisible) { ... }`, etc. inside the same list body, and control scrolling for non-content states via `userScrollEnabled`.
