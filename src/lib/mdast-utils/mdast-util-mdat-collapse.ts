import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'

/**
 * Collapses any expanded mdat comments, effectively resetting the document to
 * its pre-expansion state, preserving the original comments. No-op if no mdat
 * comments are found.
 */
export function mdatCollapse(tree: Root, file: VFile): void {
	// Collapse expanded tags
	// Find closing tags, then go back to last opening tag
	let lastOpenMarker: CommentMarkerNode | undefined
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE

		// Parse the marker to find probably mdat comments
		const marker = parseCommentNode(node, parent)

		if (marker === undefined) return CONTINUE

		if (marker.type === 'open') {
			lastOpenMarker = marker
			return CONTINUE
		}

		// If marker.type === 'close'

		// Check the match
		if (lastOpenMarker === undefined) {
			saveLog(file, 'error', 'collapse', 'Found closing marker without opening marker', node)
			return CONTINUE
		}

		if (lastOpenMarker.parent !== marker.parent) {
			saveLog(file, 'error', 'collapse', "Opening marker doesn't share a parent", node)
			return CONTINUE
		}

		if (lastOpenMarker.keyword !== marker.keyword) {
			saveLog(file, 'error', 'collapse', "Opening marker doesn't share a keyword", node)
			return CONTINUE
		}

		// Remove everything between the opening and closing markers, and remove
		// the closing marker as well
		const openMarkerIndex = parent.children.indexOf(lastOpenMarker.node)
		const closeMarkerIndex = parent.children.indexOf(marker.node)
		const nodesToRemove = closeMarkerIndex - openMarkerIndex + 1

		parent.children.splice(openMarkerIndex + 1, nodesToRemove - 1)
		lastOpenMarker = undefined

		// Return revised index since we spliced out nodes
		return [CONTINUE, index - nodesToRemove + 1]
	})
}
