/**
 * lint-staged appends the matched filenames to every command it runs, which is exactly
 * what you want for `eslint --fix` and exactly what you do not want for a whole-project
 * check: `npm run typecheck path/to/file.vue` passes those paths on to `nuxt typecheck`,
 * which does not take them. Whole-project checks therefore live in `.husky/pre-commit`,
 * and this file stays limited to per-file work.
 */
export default {
  '*.{js,ts,mjs,cjs,vue,css,json,jsonc,md,yml,yaml}': 'eslint --fix',
}
