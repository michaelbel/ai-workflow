export const meta = {
  name: 'mvi-compliance-sweep',
  description:
    'Параллельная проверка каждого ViewModel и Screen на соответствие MVI-правилам ' +
    'этого репозитория с конкретными, обоснованными правилом нарушениями.',
}

const discovery = await agent(
  `Найди каждую MVI-фичу в этом проекте: для каждой фичи — её ViewModel,
   её Screen (Composable) и определения Intent/Model/Event/State, если
   они вынесены в отдельные файлы. Сгруппируй их по фиче. Верни по одной
   записи на фичу с её именем и списком относительных путей к файлам.`,
  {
    schema: {
      type: 'object',
      required: ['features'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'files'],
            properties: {
              name: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
)

const perFeature = await pipeline(discovery.features, (feature) =>
  agent(
    `Вызови MCP-инструмент cuckcoder "get_rule" с именами "android/MVI_RULES",
     "android/MVI_STATE_RULES" и "android/MVI_ERROR_HANDLING_RULES", чтобы
     получить актуальные MVI-правила проекта. Затем проверь по этим
     правилам только файлы фичи "${feature.name}":

     ${feature.files.join('\n')}

     Указывай только конкретные нарушения, которые видны в коде — цитируй
     нарушающую строку и называй конкретное правило. Не сообщай о стиле,
     не покрытом загруженными правилами. Если фича полностью соответствует
     правилам, верни пустой массив.`,
    {
      label: feature.name,
      schema: {
        type: 'object',
        required: ['violations'],
        properties: {
          violations: {
            type: 'array',
            items: {
              type: 'object',
              required: ['file', 'rule', 'description', 'fix'],
              properties: {
                file: { type: 'string' },
                rule: { type: 'string' },
                description: { type: 'string' },
                fix: { type: 'string' },
              },
            },
          },
        },
      },
    },
  ).then((result) =>
    result ? result.violations.map((v) => ({ feature: feature.name, ...v })) : [],
  ),
)

return perFeature.flat()
