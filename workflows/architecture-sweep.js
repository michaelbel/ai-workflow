export const meta = {
  name: 'architecture-sweep',
  description:
    'Параллельный архитектурный аудит по всем модулям проекта со сведением в один ' +
    'приоритизированный план улучшений.',
}

const discovery = await agent(
  `Перечисли каждый модуль или source set верхнего уровня в этом проекте,
   заслуживающий отдельного архитектурного ревью — для Kotlin Multiplatform
   это обычно каждый Gradle-модуль (shared, androidApp, iosApp) и, внутри
   "shared", каждый пакет верхнего уровня под commonMain/kotlin, например
   data, domain и feature/<name>. Верни пути относительно корня репозитория.`,
  {
    schema: {
      type: 'object',
      required: ['units'],
      properties: { units: { type: 'array', items: { type: 'string' } } },
    },
  },
)

const perUnit = await pipeline(discovery.units, (unit) =>
  agent(
    `Ты архитектурный аудитор, рассматривающий только код под "${unit}".
     Ничего не меняй в коде. Проверь границы модулей/слоёв, направление
     зависимостей (domain не должен зависеть от data или UI), связность,
     единственную ответственность компонентов, публичные контракты между
     слоями и поток данных/управления. Указывай только находки, реально
     проверяемые в коде, а не гипотетические опасения. Если всё в порядке,
     верни пустой массив.`,
    {
      label: unit,
      schema: {
        type: 'object',
        required: ['findings'],
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['severity', 'location', 'principle', 'evidence', 'fix'],
              properties: {
                severity: { type: 'string' },
                location: { type: 'string' },
                principle: { type: 'string' },
                evidence: { type: 'string' },
                fix: { type: 'string' },
              },
            },
          },
        },
      },
    },
  ).then((result) => (result ? result.findings : [])),
)

const findings = perUnit.flat()

if (findings.length === 0) {
  return { findings: [], plan: [] }
}

const synthesis = await agent(
  `Вот архитектурные находки, собранные независимо по каждому модулю проекта:

   ${JSON.stringify(findings, null, 2)}

   Дедуплицируй пересекающиеся находки между модулями, сгруппируй связанные
   проблемы (например, одно и то же нарушение слоёв, повторённое в
   нескольких фичах), и составь единый приоритизированный план улучшений,
   упорядоченный по severity и радиусу поражения. Для каждого пункта плана
   укажи: title, затронутые локации, severity и рекомендуемую
   последовательность исправления.`,
  {
    schema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'severity', 'locations', 'fix'],
            properties: {
              title: { type: 'string' },
              severity: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              fix: { type: 'string' },
            },
          },
        },
      },
    },
  },
)

return synthesis
