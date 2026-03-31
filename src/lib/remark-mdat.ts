import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import type { Rules } from './mdat/rules'
import { mdat } from './mdast-utils/mdast-util-mdat'

export type Options = Rules

const defaultRules: Rules = {
	mdat: `Powered by the Markdown Autophagic Template system: [mdat](https://github.com/kitschpatrol/mdat).`,
}

// Schema is exported for validation in other packages

/**
 * A remark plugin that expands HTML comments in Markdown files.
 */
const remarkMdat: Plugin<[Options], Root> = function (rules) {
	const resolvedRules: Rules = { ...defaultRules, ...rules }

	return async function (tree, file) {
		await mdat(tree, file, resolvedRules)
	}
}

export default remarkMdat

export { rulesSchema as optionsSchema } from './mdat/rules'
