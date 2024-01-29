import { type CommentMarkerNode, parseCommentNode } from '../parse/parse-comment'
import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { CONTINUE, visit } from 'unist-util-visit'

export type Options = {
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
}

/**
 * Collapses any expanded magicmark comments and removes meta comments,
 * effectively resetting the document to its pre-expansion state. No-op if no
 * magicmark comments are found.
 */
const clean: Plugin<[Options], Root> = function (options) {
	return function (tree, file) {
		// Collapse expanded tags
		// Find closing tags, then go back to last opening tag
		let lastOpenMarker: (CommentMarkerNode & { type: 'close' | 'open' }) | undefined
		visit(tree, 'html', (node, index, parent) => {
			if (parent === undefined || index === undefined) return CONTINUE

			// Parse the marker to find probably magic mark comments
			const marker = parseCommentNode(node, parent, options)
			if (marker === undefined || marker.type === 'native') return CONTINUE

			// Remove meta comments generated by magicmark
			if (marker.type === 'meta') {
				parent.children.splice(index, 1)
			}

			if (marker.type === 'open') {
				// Opening marker
				lastOpenMarker = marker
				return CONTINUE
			}

			if (marker.type === 'close') {
				// Validate the match
				if (lastOpenMarker === undefined) {
					file.message('Found closing marker without opening marker', node)
					return CONTINUE
				}

				if (lastOpenMarker.parent !== marker.parent) {
					file.message("Opening marker doesn't share a parent", node)
					return CONTINUE
				}

				if (lastOpenMarker.keyword !== marker.keyword) {
					file.message("Opening marker doesn't share a keyword", node)
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
				return [CONTINUE, index - nodesToRemove]
			}
		})
	}
}

export default clean
