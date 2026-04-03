import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import type { NormalizedRules, Rules } from '../mdat/rules'
import { mdatCollapse } from './mdast-util-mdat-collapse'
import { mdatExpand } from './mdast-util-mdat-expand'
import { mdatSplit } from './mdast-util-mdat-split'

/**
 * Mdast utility that splits, collapses, and then re-expands all mdat comments
 * in the tree.
 */
export async function mdat(tree: Root, file: VFile, rules: NormalizedRules | Rules): Promise<void> {
	mdatSplit(tree, file)
	mdatCollapse(tree, file)
	await mdatExpand(tree, file, rules)
}
