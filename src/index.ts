// Export utilities for advanced use cases
export { mdat } from './lib/mdast-utils/mdast-util-mdat'
export { mdatClean } from './lib/mdast-utils/mdast-util-mdat-clean'
export { mdatExpand } from './lib/mdast-utils/mdast-util-mdat-expand'
export { mdatSplit } from './lib/mdast-utils/mdast-util-mdat-split'
export { setLogger } from './lib/mdat/log'
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
