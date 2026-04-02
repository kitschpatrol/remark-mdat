import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import type { NormalizedRules, Rules } from '../mdat/rules'
import { mdatClean } from './mdast-util-mdat-clean'
import { mdatExpand } from './mdast-util-mdat-expand'
import { mdatSplit } from './mdast-util-mdat-split'

/** Mdast utility that splits, cleans, and expands all mdat comments in the tree. */
export async function mdat(tree: Root, file: VFile, rules: NormalizedRules | Rules): Promise<void> {
	mdatSplit(tree, file)
	mdatClean(tree, file)
	await mdatExpand(tree, file, rules)
}
