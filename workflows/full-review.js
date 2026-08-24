export const meta = {
  name: 'full-review',
  description:
    'Мульти-линзовое ревью диффа, ветки или PR: собирает изменение, параллельно ' +
    'прогоняет correctness/security/performance/architecture/UX-ревью и сводит ' +
    'всё в один приоритизированный отчёт.',
  whenToUse:
    'Полное ревью изменений или GitHub PR перед мёрджем — code-review, ревью PR, ' +
    'отревьюй диф.',
}

// ── args ────────────────────────────────────────────────────────────────
//   target       : 'branch' (по умолчанию, дифф от base) | 'staged' | 'pr:<N>'
//   base         : базовая ветка для target='branch' (по умолчанию 'main')
//   postComments : постить ли инлайн-комменты в PR (только при target='pr:<N>',
//                  по умолчанию false)
const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}
const TARGET = A.target || 'branch'
const BASE = A.base || 'main'
const POST_COMMENTS = !!A.postComments

const PR_MATCH = /^pr:(.+)$/.exec(TARGET)
const PR_NUMBER = PR_MATCH ? PR_MATCH[1] : null

const diffCmd = PR_NUMBER
  ? `gh pr diff ${PR_NUMBER} (файлы: gh pr diff ${PR_NUMBER} --name-only; метаданные: ` +
    `gh pr view ${PR_NUMBER} --json title,body,baseRefName,headRefName,files)`
  : TARGET === 'staged'
    ? 'git diff --staged (файлы: git diff --staged --name-only)'
    : `git diff ${BASE}..HEAD (файлы: git diff ${BASE}..HEAD --name-only)`

phase('Diff')
const diff = await agent(
  `Собери набор изменений для этого ревью. Target: ${TARGET}.
   Выполни: ${diffCmd}.
   Верни hasChanges, краткое summary того, что делает изменение (title/description
   из "gh pr view", если это PR), список изменённых файлов и сам unified diff
   (при большом объёме — усеки, оставив содержательные хунки). Ничего не меняй —
   только сбор данных.`,
  {
    label: 'collect-diff',
    phase: 'Diff',
    model: 'sonnet',
    schema: {
      type: 'object',
      required: ['hasChanges', 'summary', 'files'],
      properties: {
        hasChanges: { type: 'boolean' },
        summary: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        diff: { type: 'string' },
      },
    },
  },
)

if (!diff || diff.hasChanges === false || !(diff.files && diff.files.length)) {
  return { status: 'no-changes', target: TARGET, findings: [] }
}

phase('Review')
const FINDING_SCHEMA = {
  type: 'object',
  required: ['severity', 'location', 'summary', 'fix'],
  properties: {
    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
    location: { type: 'string' },
    summary: { type: 'string' },
    fix: { type: 'string' },
  },
}

const lenses = [
  { dimension: 'correctness', agentType: 'ai-workflow:code-reviewer' },
  { dimension: 'security', agentType: 'ai-workflow:security-auditor' },
  { dimension: 'performance', agentType: 'ai-workflow:performance-reviewer' },
  { dimension: 'architecture', agentType: 'ai-workflow:architect-auditor' },
  { dimension: 'ux', agentType: 'ai-workflow:ux-reviewer' },
]

const perDimension = await parallel(
  lenses.map((lens) => () =>
    agent(
      `Проревьюй этот дифф только в зоне своей ответственности. Не повторяй
       находки, относящиеся к другой дисциплине.

       Summary изменения: ${diff.summary}
       Изменённые файлы: ${JSON.stringify(diff.files)}
       Diff: ${diff.diff || '(прочитай сам через ' + diffCmd + ')'}

       Указывай только находки, которые видны конкретно в диффе. Если сказать
       нечего — верни пустой массив, не выдумывай общие советы.`,
      {
        label: `review:${lens.dimension}`,
        phase: 'Review',
        agentType: lens.agentType,
        schema: {
          type: 'object',
          required: ['findings'],
          properties: { findings: { type: 'array', items: FINDING_SCHEMA } },
        },
      },
    ).then((result) =>
      result ? result.findings.map((f) => ({ dimension: lens.dimension, ...f })) : [],
    ),
  ),
)

const findings = perDimension.flat()

phase('Synthesize')
let synthesis = {
  verdict: 'APPROVE',
  findings: [],
  summary: 'Находок нет ни по одному из пяти направлений ревью.',
}
if (findings.length > 0) {
  synthesis = await agent(
    `Вот находки из пяти независимых ревью (correctness, security, performance,
     architecture, UX) одного и того же диффа:

     ${JSON.stringify(findings, null, 2)}

     Объедини дублирующиеся или пересекающиеся находки (оставь максимальный
     severity и перечисли все направления-источники), убери всё, что не
     вызвано этим диффом, отсортируй по severity и напиши короткое
     приоритизированное summary. Правило verdict: любая critical или high
     находка → REQUEST_CHANGES; только medium/low → COMMENT; только info
     или пусто → APPROVE.`,
    {
      label: 'synthesize',
      phase: 'Synthesize',
      schema: {
        type: 'object',
        required: ['verdict', 'findings', 'summary'],
        properties: {
          verdict: { type: 'string', enum: ['APPROVE', 'COMMENT', 'REQUEST_CHANGES'] },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['severity', 'location', 'summary', 'fix', 'dimensions'],
              properties: {
                severity: { type: 'string' },
                location: { type: 'string' },
                summary: { type: 'string' },
                fix: { type: 'string' },
                dimensions: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    },
  )
}

let commentResult = null
if (POST_COMMENTS && PR_NUMBER && synthesis.findings.length > 0) {
  phase('Comment')
  commentResult = await agent(
    `Запости это ревью инлайн-комментариями в PR #${PR_NUMBER} через gh CLI.
     Находки: ${JSON.stringify(synthesis.findings)}.
     Для каждой находки добавь инлайн-коммент на file:line через
     "gh api repos/:owner/:repo/pulls/${PR_NUMBER}/comments" (или
     "gh pr review ${PR_NUMBER} --comment" со сводным телом, если инлайн-позиция
     не резолвится). Формат тела: "[severity][dimensions] summary → fix".
     НЕ аппрувь, не мёрджи, не пуш и не меняй код — только оставляй
     ревью-комментарии. Верни posted (boolean) и details.`,
    {
      label: 'comment-pr',
      phase: 'Comment',
      schema: {
        type: 'object',
        required: ['posted', 'details'],
        properties: { posted: { type: 'boolean' }, details: { type: 'string' } },
      },
    },
  )
}

return {
  status: 'reviewed',
  target: TARGET,
  verdict: synthesis.verdict,
  summary: synthesis.summary,
  findings: synthesis.findings,
  comments: commentResult,
}
