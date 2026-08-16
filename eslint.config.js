import antfu from '@antfu/eslint-config'

export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // antfu's preset turns this off; re-enable so templates wrap once an
      // element gets busy: up to 3 attributes inline, otherwise one per line.
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 3 },
        multiline: { max: 1 },
      }],
    },
  },
)
