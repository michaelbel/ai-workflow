export const meta = {
  name: 'redesign-sweep',
  description:
    'Визуальный редизайн экрана или компонента: параллельный UX/архитектурный аудит ' +
    'текущего UI, design brief, реализация по платформам в изолированном worktree ' +
    'и проверка сборки. Бизнес-логика не трогается.',
  whenToUse:
    'Редизайн UI без изменения поведения — редизайн, обнови дизайн экрана, ' +
    'поменяй стиль.',
}

// ── args ────────────────────────────────────────────────────────────────
//   target : экран или компонент для редизайна (свободный текст, обязателен)
const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}
const TARGET = A.target || A.request || ''

if (!TARGET) {
  return { status: 'skipped', reason: 'Не передан target — экран или компонент для редизайна.' }
}

phase('Design')
const lenses = [
  {
    role: 'ux',
    agentType: 'cuckcoder:ux-reviewer',
    focus:
      'текущие визуальные состояния (loading/empty/error/populated), навигация, ' +
      'accessibility, консистентность с соседними экранами и дизайн-системой',
  },
  {
    role: 'architecture',
    agentType: 'cuckcoder:architect-auditor',
    focus:
      'насколько сильно визуальный слой связан с бизнес-логикой и состоянием, ' +
      'чтобы визуальное изменение осталось изолированным',
  },
]

const audits = await parallel(
  lenses.map((l) => () =>
    agent(
      `Цель редизайна: "${TARGET}". Твоя линза — ${l.role}: ${l.focus}.
       Проанализируй ТЕКУЩЕЕ состояние этого UI, читая реальный код.
       Изменится только визуальный слой — бизнес-логика и поведение остаются
       нетронутыми. Верни наблюдения и конкретные рекомендации.`,
      {
        label: `design:${l.role}`,
        phase: 'Design',
        agentType: l.agentType,
        schema: {
          type: 'object',
          required: ['observations', 'recommendations'],
          properties: {
            observations: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    ),
  ),
)

const brief = await agent(
  `Собери design brief для редизайна "${TARGET}".
   Находки аудита: ${JSON.stringify(audits.filter(Boolean))}.
   Перечисли компоненты к изменению, визуальные токены (цвет, типографика,
   spacing, форма), какие платформы затронуты (android-compose и/или
   ios-swiftui), и явный список того, что должно остаться неизменным
   (вся бизнес-логика, обработка состояния и поведение). Каждый пункт —
   атомарное визуальное изменение.`,
  {
    label: 'design-brief',
    phase: 'Design',
    schema: {
      type: 'object',
      required: ['components', 'platforms', 'unchanged'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        tokens: { type: 'string' },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['android-compose', 'ios-swiftui'] },
        },
        unchanged: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)

phase('Implement')
const platforms = brief.platforms && brief.platforms.length ? brief.platforms : ['android-compose']
const targets = platforms.map((p) =>
  p === 'ios-swiftui'
    ? { name: p, agentType: 'cuckcoder:swiftui-builder' }
    : { name: p, agentType: 'cuckcoder:compose-builder' },
)

const impls = await parallel(
  targets.map((t) => () =>
    agent(
      `Цель редизайна: "${TARGET}". Платформа: ${t.name}.
       Design brief: ${JSON.stringify(brief)}.
       Примени ТОЛЬКО визуальные изменения (стили, layout, токены) из этого
       brief. НЕ трогай бизнес-логику, обработчики событий, состояние или
       контракты навигации — они перечислены в "unchanged". Используй токены
       дизайн-системы, а не захардкоженные значения. Верни изменённые файлы
       и краткое summary.`,
      {
        label: `implement:${t.name}`,
        phase: 'Implement',
        agentType: t.agentType,
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
const changedFiles = impls.filter(Boolean).flatMap((r) => r.changedFiles || [])
const validation = await agent(
  `Провалидируй этот редизайн. Изменённые файлы: ${JSON.stringify(changedFiles)}.
   Собери проект (найди build-инструмент: gradlew, swift build и т.п.) и
   убедись, что нет ошибок компиляции. Если в окружении доступен инструмент
   скриншота устройства/эмулятора/симулятора — сделай один скриншот
   "${TARGET}" после изменения для визуального подтверждения; иначе пропусти
   этот шаг и напиши об этом. Верни passed (boolean) и details.`,
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
  status: validation && validation.passed ? 'redesigned' : 'redesign-unverified',
  brief,
  changedFiles,
  validation,
}
