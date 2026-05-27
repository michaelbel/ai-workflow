# GitHub README Rules

Every README follows this fixed structure, in this order:

## 1. Last-commit badge (always first)

```markdown
[![last-commit](https://img.shields.io/github/last-commit/<owner>/<repo>?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/<owner>/<repo>/commits)
```

## 2. Project description

Two sentences max. Plain prose, no headers, describes what the project does.

## 3. Screenshot

```markdown
<div align="left">
    <img src="cover.png" alt="Cover">
</div>
```

## 4. Technologies

`## Technologies` header followed by shield badges, one per technology, all linking to the repo root.

```markdown
## Technologies
[![<name>](https://img.shields.io/badge/<label>-<color>.svg?style=for-the-badge&logo=<logo>&logoColor=<color>)](https://github.com/<owner>/<repo>)
```

---

### Full example

```markdown
[![last-commit](https://img.shields.io/github/last-commit/michaelbel/total?style=for-the-badge&logo=github&labelColor=3F464F)](https://github.com/michaelbel/total/commits)

Веб-калькулятор, который складывает числа, введённые столбиком, и сразу показывает итоговую сумму.

<div align="left">
    <img src="cover.png" alt="Cover">
</div>

## Technologies
[![js](https://img.shields.io/badge/javascript-F7E018.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/michaelbel/total)
[![html](https://img.shields.io/badge/html-E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://github.com/michaelbel/total)
[![css](https://img.shields.io/badge/css-663399.svg?style=for-the-badge&logo=css&logoColor=white)](https://github.com/michaelbel/total)
```
