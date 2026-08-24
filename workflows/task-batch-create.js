export const meta = {
  name: 'task-batch-create',
  description:
    'Декомпозирует фичу или эпик на отдельные задачи и создаёт их все параллельно ' +
    'в GitHub Issues или Notion — для одиночной задачи проще обратиться к агенту ' +
    'трекера напрямую.',
  whenToUse:
    'Разбивка фичи/эпика на много задач сразу — заведи задачи, разбей на таски ' +
    'и создай.',
}

// ── args ────────────────────────────────────────────────────────────────
//   request  : описание фичи/эпика для декомпозиции (обязателен)
//   platform : 'github' (по умолчанию) | 'notion'
//   target   : "owner/repo" для GitHub, либо имя/id базы Notion — обязателен
const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}
const REQUEST = A.request || ''
const PLATFORM = A.platform || 'github'
const TARGET = A.target || ''

if (!REQUEST || !TARGET) {
  return {
    status: 'skipped',
    reason: 'Нужны и "request", и "target" (репозиторий или база Notion).',
  }
}

phase('Decompose')
const decomposition = await agent(
  `Разбей эту фичу/эпик на отдельные, независимо выполнимые задачи:

   "${REQUEST}"

   Для каждой задачи нужно: title (в повелительном наклонении, например
   "Добавить X", "Исправить Y"), type (bug/feature/improvement/task),
   description (2-4 предложения), acceptanceCriteria (минимум 2 конкретных
   критерия) и labels. Дели по естественным границам (слой, экран,
   endpoint) — не создавай задачи меньше чем на полдня работы и не
   объединяй несвязанные вещи в одну задачу.`,
  {
    label: 'decompose',
    phase: 'Decompose',
    schema: {
      type: 'object',
      required: ['tasks'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'type', 'description', 'acceptanceCriteria', 'labels'],
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['bug', 'feature', 'improvement', 'task'] },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              labels: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
)

const tasks = (decomposition && decomposition.tasks) || []
if (tasks.length === 0) {
  return { status: 'no-tasks', request: REQUEST }
}

phase('Create')
const agentType = PLATFORM === 'notion'
  ? 'ai-workflow:notion-project-manager'
  : 'ai-workflow:github-project-manager'

const created = await pipeline(tasks, (task) =>
  agent(
    `Создай ровно один ${PLATFORM === 'notion' ? 'таск в Notion' : 'GitHub Issue'}
     в "${TARGET}" для этой задачи, части более крупного эпика "${REQUEST}":

     ${JSON.stringify(task, null, 2)}

     Тело/описание должно включать acceptance criteria как чек-лист.
     Не создавай никаких других issue и не изменяй существующие. Верни
     url и id созданного элемента.`,
    {
      label: task.title,
      phase: 'Create',
      agentType,
      schema: {
        type: 'object',
        required: ['url', 'id'],
        properties: { url: { type: 'string' }, id: { type: 'string' } },
      },
    },
  ).then((result) => ({ title: task.title, ...result })),
)

return {
  status: 'created',
  platform: PLATFORM,
  target: TARGET,
  tasks: created,
}
