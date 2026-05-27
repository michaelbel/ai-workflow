# Repository Structure Rules

Every GitHub repository must follow this structure.

## .github/FUNDING.yml

```yaml
custom: [
  boosty.to/michaelbel,
  tbank.ru/cf/5YrkxI1CsmO,
  https://pay.cloudtips.ru/p/fce67f60,
  https://yoomoney.ru/fundraise/1CSMJ5M9RKB.250919
]
```

After pushing: go to **Settings → General → Sponsorships** and enable the Sponsor button.

## .github/CODEOWNERS

```
* @michaelbel
```

## .idea/icon.svg

The `.idea/` directory must contain `icon.svg` (project icon). The directory itself is gitignored except for this file.

## .gitignore

```
.claude/
.idea/
!.idea/icon.svg
```

## AI instruction files

- `AGENTS.md` — main instructions file (committed, real file)
- `CLAUDE.md` — symlink → `AGENTS.md`
- `GEMINI.md` — symlink → `AGENTS.md`

Create symlinks:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
```

---

### Checklist when setting up a new repo

- [ ] `.github/FUNDING.yml` with all four funding links
- [ ] Sponsorships enabled in GitHub Settings
- [ ] `.github/CODEOWNERS` with `* @michaelbel`
- [ ] `.idea/icon.svg` present and tracked
- [ ] `.gitignore` with `.claude/`, `.idea/`, `!.idea/icon.svg`
- [ ] `AGENTS.md` committed
- [ ] `CLAUDE.md` symlink → `AGENTS.md`
- [ ] `GEMINI.md` symlink → `AGENTS.md`
