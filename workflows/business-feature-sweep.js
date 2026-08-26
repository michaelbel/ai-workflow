export const meta = {
  name: 'business-feature-sweep',
  description:
    'Реализация фичи целиком: параллельный research (архитектура/UX/security/бизнес/ ' +
    'devops), план, DoD/DoR-спека, параллельная реализация по платформам в ' +
    'изолированных worktree на feature-ветке и валидация сборки/тестов против спеки.',
  whenToUse: 'Новая фича, новый экран, новый endpoint — новая фича, новый экран, доработка.',
}

// ── args ────────────────────────────────────────────────────────────────
//   request    : описание фичи от пользователя (обязателен)
//   baseBranch : ветка, от которой бранчеваться (по умолчанию 'main')
const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}
const REQUEST = A.request || ''
const BASE_BRANCH = A.baseBranch || 'main'

if (!REQUEST) {
  return { status: 'skipped', reason: 'Не передано описание фичи.' }
}

phase('Research')
const lenses = [
  {
    role: 'architecture',
    agentType: 'cuckcoder:architect-auditor',
    focus:
      'как эта фича впишется в существующие границы модулей, слои и ' +
      'зависимости без нарушения инвариантов',
  },
  {
    role: 'ux',
    agentType: 'cuckcoder:ux-reviewer',
    focus:
      'необходимые визуальные состояния (loading/empty/error/offline/populated), ' +
      'навигация, accessibility и консистентность с соседними экранами',
  },
  {
    role: 'security',
    agentType: 'cuckcoder:security-auditor',
    focus: 'авторизация, валидация ввода, секреты и другие риски, которые вносит эта фича',
  },
  {
    role: 'business',
    agentType: 'cuckcoder:business-analyst',
    focus:
      'scope, ожидаемые пользователи, критерии успеха и любая неоднозначность ' +
      'или пропущенные acceptance criteria в запросе',
  },
  {
    role: 'devops',
    agentType: 'cuckcoder:devops-expert',
    focus: 'конфигурация, feature flags, окружения и вопросы rollout/релиза',
  },
]

const findings = await parallel(
  lenses.map((l) => () =>
    agent(
      `Запрос на фичу: "${REQUEST}". Твоя линза — ${l.role}: ${l.focus}.
       Исследуй кодовую базу (read, grep) на предмет того, что важно для
       этой фичи с твоей точки зрения. Верни analysis, concerns/риски и
       конкретные recommendations.`,
      {
        label: `research:${l.role}`,
        phase: 'Research',
        agentType: l.agentType,
        schema: {
          type: 'object',
          required: ['analysis', 'concerns', 'recommendations'],
          properties: {
            analysis: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    ),
  ),
)

phase('Plan')
const plan = await agent(
  `Собери план реализации фичи "${REQUEST}" по этому research:
   ${JSON.stringify(findings.filter(Boolean))}
   Дай пошаговые steps, какие слои платформы затронуты (shared-kotlin,
   android-compose, ios-swift, ios-swiftui — любое подмножество) и
   ключевые риски.`,
  {
    label: 'plan',
    phase: 'Plan',
    schema: {
      type: 'object',
      required: ['steps', 'affectedLayers', 'risks'],
      properties: {
        steps: { type: 'array', items: { type: 'string' } },
        affectedLayers: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['shared-kotlin', 'android-compose', 'ios-swift', 'ios-swiftui'],
          },
        },
        risks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)

phase('Spec')
const spec = await agent(
  `Напиши контракт приёмки для фичи "${REQUEST}".
   План: ${JSON.stringify(plan)}
   UX-research: ${JSON.stringify(findings.find((f) => f))}
   Дай: DoD (что значит "готово"), DoR (что должно быть готово до старта),
   каждое обязательное визуальное состояние (loading, empty, error,
   offline, populated), edge cases и бизнес-правила/инварианты. Ничто в
   Executing не может пропустить состояние или edge case из этого списка.`,
  {
    label: 'spec',
    phase: 'Spec',
    agentType: 'cuckcoder:business-analyst',
    schema: {
      type: 'object',
      required: ['dod', 'dor', 'states', 'edgeCases'],
      properties: {
        dod: { type: 'array', items: { type: 'string' } },
        dor: { type: 'array', items: { type: 'string' } },
        states: {
          type: 'object',
          properties: {
            loading: { type: 'string' },
            empty: { type: 'string' },
            error: { type: 'string' },
            offline: { type: 'string' },
            populated: { type: 'string' },
          },
        },
        edgeCases: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)

phase('Executing')
const affectedLayers =
  plan.affectedLayers && plan.affectedLayers.length ? plan.affectedLayers : ['shared-kotlin']
const layerAgents = {
  'shared-kotlin': 'cuckcoder:kotlin-engineer',
  'android-compose': 'cuckcoder:compose-builder',
  'ios-swift': 'cuckcoder:swift-engineer',
  'ios-swiftui': 'cuckcoder:swiftui-builder',
}

const branchSlug = REQUEST.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .slice(0, 40)
  .replace(/(^-|-$)/g, '')

const execResults = await parallel(
  affectedLayers.map((layer) => () =>
    agent(
      `Реализуй свою часть фичи "${REQUEST}" на слое "${layer}".
       Ветвись от origin/${BASE_BRANCH}: git fetch origin ${BASE_BRANCH} &&
       git checkout -b feature/${branchSlug} origin/${BASE_BRANCH}.
       План: ${JSON.stringify(plan)}
       Спека (DoD/DoR): ${JSON.stringify(spec)}
       Реализуй каждое состояние и edge case из спеки, а не только happy
       path. Верни изменённые файлы и summary реализованного.`,
      {
        label: `execute:${layer}`,
        phase: 'Executing',
        agentType: layerAgents[layer] || 'cuckcoder:kotlin-engineer',
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
  `Провалидируй фичу "${REQUEST}". Изменённые файлы: ${JSON.stringify(changedFiles)}.
   Спека: ${JSON.stringify(spec)}.
   Собери проект и запусти тесты. Затем сверь со спекой: реализовано ли
   каждое перечисленное состояние и edge case? Верни passed, buildPassed,
   dodChecked (boolean) и details.`,
  {
    label: 'validate',
    phase: 'Validate',
    agentType: 'cuckcoder:build-engineer',
    schema: {
      type: 'object',
      required: ['passed', 'buildPassed', 'dodChecked', 'details'],
      properties: {
        passed: { type: 'boolean' },
        buildPassed: { type: 'boolean' },
        dodChecked: { type: 'boolean' },
        details: { type: 'string' },
      },
    },
  },
)

return {
  status: validation && validation.passed ? 'done' : 'partial',
  plan,
  spec,
  execResults: execResults.filter(Boolean),
  validation,
}
