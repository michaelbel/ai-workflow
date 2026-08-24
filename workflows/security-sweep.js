export const meta = {
  name: 'security-sweep',
  description:
    'Параллельный security-аудит по каждому модулю проекта с независимой проверкой ' +
    'каждой находки перед итоговой выдачей.',
}

const discovery = await agent(
  `Перечисли каждый модуль верхнего уровня или feature-пакет в этом проекте,
   содержащий прикладной код, который стоит проверить отдельно (Gradle-модули,
   KMP source set-ы или feature-пакеты вида shared/data/feature/<name> и
   androidApp/feature/<name>). Верни пути относительно корня репозитория —
   без build-вывода, сгенерированного кода и сторонних зависимостей.`,
  {
    schema: {
      type: 'object',
      required: ['modules'],
      properties: { modules: { type: 'array', items: { type: 'string' } } },
    },
  },
)

const perModule = await pipeline(discovery.modules, (module) =>
  agent(
    `Ты старший application security engineer, проводящий read-only аудит
     только модуля "${module}". Сначала построй краткую threat model (активы,
     актёры, границы доверия), затем проверь аутентификацию, авторизацию,
     секреты, криптографию, границы ввода/вывода, конфигурацию платформы
     (манифест, exported-компоненты, permissions), transport security и
     риски supply chain. Указывай только находки с конкретным эксплуатируемым
     attack path и предусловиями — без общих советов по hardening. Если
     находок нет, верни пустой массив.`,
    {
      label: module,
      schema: {
        type: 'object',
        required: ['findings'],
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['severity', 'location', 'summary', 'attackPath', 'fix'],
              properties: {
                severity: { type: 'string' },
                location: { type: 'string' },
                summary: { type: 'string' },
                attackPath: { type: 'string' },
                impact: { type: 'string' },
                fix: { type: 'string' },
                validation: { type: 'string' },
              },
            },
          },
        },
      },
    },
  ).then((result) => (result ? result.findings : [])),
)

const candidates = perModule.flat()

const verified = await pipeline(candidates, (finding) =>
  agent(
    `Независимо проверь эту заявленную security-находку — перечитай код сам,
     не доверяя исходному описанию. Подтверди, реален и достижим ли
     attack path с учётом фактических проверок авторизации, валидации
     ввода и конфигурации платформы.

     Заявленная находка:
     ${JSON.stringify(finding, null, 2)}

     Верни те же поля плюс "confirmed" (boolean) и "confidence"
     (50, 75 или 100). Если находка не подтвердилась, установи
     confirmed: false и объясни причину в поле "reason".`,
    {
      label: finding.location,
      schema: {
        type: 'object',
        required: ['confirmed', 'confidence'],
        properties: {
          confirmed: { type: 'boolean' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
          severity: { type: 'string' },
          location: { type: 'string' },
          summary: { type: 'string' },
          attackPath: { type: 'string' },
          impact: { type: 'string' },
          fix: { type: 'string' },
          validation: { type: 'string' },
        },
      },
    },
  ),
)

return verified.filter((finding) => finding?.confirmed)
