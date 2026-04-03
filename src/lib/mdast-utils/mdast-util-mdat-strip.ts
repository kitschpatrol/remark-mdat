import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { CONTINUE, visit } from 'unist-util-visit'
import { parseCommentNode } from '../mdat/parse'

/**
 * Strips all mdat comment nodes (both opening and closing) from the tree,
 * preserving any content between them. Code-style comments (`//`, `#`, `/*`)
 * are left untouched.
 */
export function mdatStrip(tree: Root, _file: VFile): void {
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE

		const marker = parseCommentNode(node, parent)

		if (marker === undefined) return CONTINUE

		parent.children.splice(index, 1)

		return [CONTINUE, index]
	})
}
