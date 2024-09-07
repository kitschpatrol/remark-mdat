// Export utilities for advanced use cases
export { mdat, type Options as MdatOptions } from './lib/mdast-utils/mdast-util-mdat'
export {
	mdatCheck,
	type Options as MdatCheckOptions,
} from './lib/mdast-utils/mdast-util-mdat-check'
export {
	mdatClean,
	type Options as MdatCleanOptions,
} from './lib/mdast-utils/mdast-util-mdat-clean'
export {
	mdatExpand,
	type Options as MdatExpandOptions,
} from './lib/mdast-utils/mdast-util-mdat-expand'
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
