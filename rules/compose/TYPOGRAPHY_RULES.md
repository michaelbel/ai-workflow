# Typography Rules

- Always set text style via the `style` argument on `Text` or `CourierFixedText`; never use the individual `fontSize`, `fontWeight`, or `color` arguments.
- Use `MaterialTheme.typography.<token>` extensions as the base style, then apply overrides with `.copy(color = ..., lineHeight = ..., letterSpacing = ..., textAlign = ...)`.
- Do not instantiate `TextStyle(...)` directly inside composables; always start from a `MaterialTheme.typography` token.
- Available tokens follow the pattern `regular<size>` (weight 400) and `medium<size>` (weight 500): `regular12`, `regular14`, `regular15`, `regular16`, `regular18`, `regular22`, `medium11`, `medium12`, `medium14`, `medium16`, `medium17`, `medium22`. Use the token whose size and weight match the design; do not create ad-hoc `TextStyle` instances to approximate an existing token.
- For `textAlign`, pass it inside `.copy(textAlign = ...)` on the style, not as a standalone `textAlign` argument on `Text`.
- For `AnnotatedString` spans, use `MaterialTheme.typography.spanRegular14` or `spanMedium14` as `SpanStyle` bases.
- Do not hardcode colors inside `TextStyle`; always reference `MaterialTheme.colorScheme.*`.
