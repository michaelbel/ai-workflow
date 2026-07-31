# Правила структуры репозитория

Каждый GitHub-репозиторий должен следовать этой структуре.

## .github/FUNDING.yml

```yaml
custom: [
  boosty.to/michaelbel,
  tbank.ru/cf/5YrkxI1CsmO,
  https://pay.cloudtips.ru/p/fce67f60,
  https://yoomoney.ru/fundraise/1CSMJ5M9RKB.250919
]
```

После push: перейди в **Settings → General → Sponsorships** и включи кнопку Sponsor.

## .github/CODEOWNERS

```
* @michaelbel
```

## .idea/icon.svg

Директория `.idea/` должна содержать `icon.svg` (иконку проекта). Сама директория в gitignore, кроме
этого файла.

## .gitignore

```
.claude/
.idea/
!.idea/icon.svg
```

## Файлы инструкций для AI

- `AGENTS.md` — основной файл инструкций (закоммичен, реальный файл)
- `CLAUDE.md` — симлинк → `AGENTS.md`
- `GEMINI.md` — симлинк → `AGENTS.md`

Создание симлинков:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
```

---

### Чек-лист при настройке нового репозитория

- [ ] `.github/FUNDING.yml` со всеми четырьмя ссылками на донаты
- [ ] Sponsorships включены в GitHub Settings
- [ ] `.github/CODEOWNERS` с `* @michaelbel`
- [ ] `.idea/icon.svg` присутствует и отслеживается
- [ ] `.gitignore` с `.claude/`, `.idea/`, `!.idea/icon.svg`
- [ ] `AGENTS.md` закоммичен
- [ ] `CLAUDE.md` симлинк → `AGENTS.md`
- [ ] `GEMINI.md` симлинк → `AGENTS.md`
