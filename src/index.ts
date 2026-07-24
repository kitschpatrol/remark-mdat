// Export utilities for advanced use cases
export { mdat } from './lib/mdast-utils/mdast-util-mdat'
export { mdatClean } from './lib/mdast-utils/mdast-util-mdat-clean'
export { mdatCollapse } from './lib/mdast-utils/mdast-util-mdat-collapse'
export { mdatDiff } from './lib/mdast-utils/mdast-util-mdat-diff'
export type { MdatDiffResult } from './lib/mdast-utils/mdast-util-mdat-diff'
export { mdatExpand } from './lib/mdast-utils/mdast-util-mdat-expand'
export { mdatSplit } from './lib/mdast-utils/mdast-util-mdat-split'
export { mdatStrip } from './lib/mdast-utils/mdast-util-mdat-strip'
export { setLogger } from './lib/mdat/log'
export { getMdatReports, reporterMdat } from './lib/mdat/mdat-log'
export type { MdatFileReport, MdatMessage } from './lib/mdat/mdat-log'
export { getSoleRule, getSoleRuleKey, rulesSchema } from './lib/mdat/rules'
export type {
	NormalizedRule,
	NormalizedRules,
	Rule,
	RuleContext,
	Rules,
	SimplifyDeep,
} from './lib/mdat/rules'
export { default, optionsSchema } from './lib/remark-mdat'
export type { Options } from './lib/remark-mdat'
