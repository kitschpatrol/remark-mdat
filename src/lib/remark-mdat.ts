import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { z } from 'zod'
import type { Rules } from './mdat/rules'
import { mdat } from './mdast-utils/mdast-util-mdat'
import { normalizeRules, rulesSchema } from './mdat/rules'

/** Configuration for the remarkMdat plugin. */
export type Options = {
	/** Rules mapping comment keywords to expansion content. Merged with built-in defaults. */
	rules?: Rules
}

const defaultRules: Rules = {
	mdat: `Powered by the Markdown Autophagic Template system: [mdat](https://github.com/kitschpatrol/mdat).`,
}

/** Zod schema for validating {@link Options}. */
export const optionsSchema = z
	.object({
		rules: rulesSchema.optional(),
	})
	.describe('MDAT Plugin Options')

/**
 * A remark plugin that expands HTML comments in Markdown files.
 */
const remarkMdat: Plugin<[Options?], Root> = function (options) {
	const resolvedRules: Rules = { ...defaultRules, ...options?.rules }
	const normalizedRules = normalizeRules(resolvedRules)

	return async function (tree, file) {
		await mdat(tree, file, normalizedRules)
	}
}

export default remarkMdat
