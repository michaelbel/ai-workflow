export const meta = {
  name: 'refactoring-sweep',
  description:
    'Аудит → triage → (опционально) применение рефакторинга по проекту: параллельный ' +
    'аудит линзами архитектуры/упрощения/безопасности/производительности, затем ' +
    'применение одобренных фиксов в изолированных worktree по платформам и ' +
    'валидация сборки.',
  whenToUse: 'Крупный рефакторинг или чистка — рефакторинг, почисти код, убери дублирование.',
}

// ── args ────────────────────────────────────────────────────────────────
//   request        : что рефакторить / область фокуса (может быть пустым —
//                     "весь проект")
//   mode           : 'audit-only' (по умолчанию) | 'apply'
//   severityFilter : 'all' | 'critical+high' (по умолчанию) | 'critical-only' —
//                     какие находки чинит mode='apply'
const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}
const REQUEST = A.request || 'общая чистка кода'
const MODE = A.mode || 'audit-only'
const SEVERITY_FILTER = A.severityFilter || 'critical+high'

const FINDING_SCHEMA = {
  type: 'object',
  required: ['file', 'issue', 'severity', 'fix'],
  properties: {
    file: { type: 'string' },
    line: { type: 'string' },
    issue: { type: 'string' },
    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    fix: { type: 'string' },
  },
}

phase('Audit')
const lenses = [
  {
    role: 'architecture',
    agentType: 'cuckcoder:architect-auditor',
    focus:
      'границы слоёв, направление зависимостей, связность, единственная ' +
      'ответственность, публичные контракты',
  },
  {
    role: 'simplification',
    agentType: 'cuckcoder:code-refine',
    focus:
      'мёртвый код, дублирование, лишняя вложенность или абстракция, ' +
      'переусложнённый control flow — только отчёт, не применяй пока',
  },
  {
    role: 'security',
    agentType: 'cuckcoder:security-auditor',
    focus:
      'захардкоженные секреты, отсутствующая авторизация, небезопасная ' +
      'обработка ввода, небезопасные значения по умолчанию',
  },
  {
    role: 'performance',
    agentType: 'cuckcoder:performance-reviewer',
    focus:
      'лишняя рекомпозиция, блокирующая main thread работа, N+1-запросы, ' +
      'неограниченный рост памяти',
  },
]

const perLens = await parallel(
  lenses.map((l) => () =>
    agent(
      `Аудит рефакторинга. Область фокуса: "${REQUEST}". Твоя линза — ${l.role}:
       ${l.focus}. Читай реальный код. Указывай только конкретно проверяемые
       находки, каждая с file, line если известна, issue, severity и
       минимальным fix. Если проблем нет, верни пустой массив.`,
      {
        label: `audit:${l.role}`,
        phase: 'Audit',
        agentType: l.agentType,
        schema: {
          type: 'object',
          required: ['findings'],
          properties: { findings: { type: 'array', items: FINDING_SCHEMA } },
        },
      },
    ).then((result) => (result ? result.findings.map((f) => ({ role: l.role, ...f })) : [])),
  ),
)

const allFindings = perLens.flat()

phase('Triage')
const triage = await agent(
  `Сгруппируй эти находки рефакторинга по severity и дедуплицируй
   пересекающиеся (один и тот же file+issue от нескольких линз — объедини,
   оставь максимальный severity, перечисли все линзы-источники):

   ${JSON.stringify(allFindings, null, 2)}

   Severity-фильтр для одобренного плана: "${SEVERITY_FILTER}" ("all" — всё,
   "critical+high" — только critical и high, "critical-only" — только
   critical). Верни counts по severity и approvedPlan — находки, прошедшие
   фильтр.`,
  {
    label: 'triage',
    phase: 'Triage',
    schema: {
      type: 'object',
      required: ['counts', 'approvedPlan'],
      properties: {
        counts: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
          },
        },
        approvedPlan: { type: 'array', items: FINDING_SCHEMA },
      },
    },
  },
)

if (MODE === 'audit-only' || !triage.approvedPlan || triage.approvedPlan.length === 0) {
  return { status: 'audited', counts: triage.counts, approvedPlan: triage.approvedPlan || [] }
}

phase('Execute')
const isCompose = (f) => /\.kt$/.test(f) && /(screen|composable|compose|ui\/)/i.test(f)
const isSwiftUI = (f) => /\.swift$/.test(f) && /(view|screen)/i.test(f)
const isSwift = (f) => /\.swift$/.test(f) && !isSwiftUI(f)
const isKotlin = (f) => /\.kt(s)?$/.test(f) && !isCompose(f)

const layers = [
  { name: 'kotlin', agentType: 'cuckcoder:kotlin-engineer', match: isKotlin },
  { name: 'compose', agentType: 'cuckcoder:compose-builder', match: isCompose },
  { name: 'swift', agentType: 'cuckcoder:swift-engineer', match: isSwift },
  { name: 'swiftui', agentType: 'cuckcoder:swiftui-builder', match: isSwiftUI },
]
  .map((layer) => ({
    ...layer,
    plan: triage.approvedPlan.filter((f) => layer.match(f.file || '')),
  }))
  .filter((layer) => layer.plan.length > 0)

const execResults = await parallel(
  layers.map((layer) => () =>
    agent(
      `Примени ровно этот одобренный план рефакторинга и ничего сверх него —
       никаких попутных улучшений, не трогай файлы вне этого списка:

       ${JSON.stringify(layer.plan, null, 2)}

       Сохраняй публичный API, если план явно не говорит иное. Не ломай
       существующие тесты. Следуй конвенциям и правилам этого проекта.
       Верни список изменённых файлов и краткое summary изменений и причин.`,
      {
        label: `execute:${layer.name}`,
        phase: 'Execute',
        agentType: layer.agentType,
        isolation: 'worktree',
        schema: {
          type: 'object',
          required: ['changedFiles', 'summary'],
          properties: {
            changedFiles: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
        },
      },
    ),
  ),
)

phase('Validate')
const changedFiles = execResults.filter(Boolean).flatMap((r) => r.changedFiles || [])
const validation = await agent(
  `Провалидируй этот рефакторинг. Изменённые файлы: ${JSON.stringify(changedFiles)}.
   Собери проект и запусти его тесты (найди build-инструмент: gradlew,
   swift build и т.п.). Верни passed (boolean) и details (что запускал
   и результат).`,
  {
    label: 'validate',
    phase: 'Validate',
    agentType: 'cuckcoder:build-engineer',
    schema: {
      type: 'object',
      required: ['passed', 'details'],
      properties: { passed: { type: 'boolean' }, details: { type: 'string' } },
    },
  },
)

return {
  status: validation && validation.passed ? 'refactored' : 'refactored-with-issues',
  counts: triage.counts,
  execResults: execResults.filter(Boolean),
  changedFiles,
  validation,
}
