/* eslint-disable jsdoc/require-jsdoc */

import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import type { Rules } from '../mdat/rules'
import { mdatCheck } from './mdast-util-mdat-check'
import { mdatClean } from './mdast-util-mdat-clean'
import { mdatExpand } from './mdast-util-mdat-expand'
import { mdatSplit } from './mdast-util-mdat-split'

export async function mdat(tree: Root, file: VFile, rules: Rules): Promise<void> {
	mdatSplit(tree, file)
	mdatClean(tree, file)
	await mdatExpand(tree, file, rules)
	await mdatCheck(tree, file, rules)
}
