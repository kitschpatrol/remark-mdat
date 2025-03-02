import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
	ignores: ['test/assets/', '__snapshots__/'],
	type: 'lib',
})
