import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig(
	{
		ignores: ['test/assets/', '__snapshots__/'],
		ts: {
			overrides: {
				'ts/no-deprecated': 'off',
			},
		},
		type: 'lib',
	},
	{
		files: ['readme.md/*'],
		rules: {
			'perfectionist/sort-objects': ['off'],
		},
	},
)
