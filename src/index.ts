// Export utilities for advanced use cases
export { mdat, type MdatOptions } from './lib/mdast-utils/mdast-util-mdat'
export { mdatCheck, type MdatCheckOptions } from './lib/mdast-utils/mdast-util-mdat-check'
export { mdatClean, type MdatCleanOptions } from './lib/mdast-utils/mdast-util-mdat-clean'
export { mdatExpand, type MdatExpandOptions } from './lib/mdast-utils/mdast-util-mdat-expand'
export { mdatSplit } from './lib/mdast-utils/mdast-util-mdat-split'
export { deepMergeDefined } from './lib/mdat/deep-merge-defined'
export { default as log } from './lib/mdat/log'
export {
	getMdatReports,
	type MdatFileReport,
	type MdatMessage,
	reporterMdat,
} from './lib/mdat/mdat-log'
export {
	getSoleRule,
	getSoleRuleKey,
	type NormalizedRule,
	type NormalizedRules,
	type Rule,
	type Rules,
	rulesSchema,
	type SimplifyDeep,
} from './lib/mdat/rules'
export { default, type Options, optionsSchema } from './lib/remark-mdat'
