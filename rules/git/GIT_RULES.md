# Git Rules

- Never commit unrelated files together; stage selectively and make one focused commit per logical change with a clear, specific message.
- When the user asks to commit, choose an appropriate commit message and commit all currently changed files using one or several focused commits; do not leave files in a modified state. If the user changed or removed something themselves, commit only the current working tree state and do not restore changes from your context.
- Commit dependency updates one per commit as `Bump <dependency> from <old version> to <new version>` — even if multiple deps are in the same file, apply each change separately and commit individually.
