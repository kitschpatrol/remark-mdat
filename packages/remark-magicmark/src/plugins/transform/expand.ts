import { type CommentMarkerNode, parseCommentNode } from '../parse'
import { loadRules } from '../rules'
import type { Html, Root } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Plugin } from 'unified'
import { CONTINUE, visit } from 'unist-util-visit'

export type Options = {
	addMetaComment: boolean
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
	ruleFiles: string[]
}

type ValidCommentMarker = CommentMarkerNode & {
	type: 'close' | 'open'
}

/*
 * Mdast utility plugin to collapse magicmark comments and strip generated meta
 * comments, effectively resetting the document to its original state.
 */
const expand: Plugin<[Options], Root> = function (options) {
	return async function (tree, file) {
		const { addMetaComment, closingPrefix, keywordPrefix, metaCommentIdentifier, ruleFiles } =
			options

		const resolvedRules = await loadRules(ruleFiles)

		// Get all valid comment markers from the tree
		const commentMarkers: ValidCommentMarker[] = []
		visit(tree, 'html', (node, index, parent) => {
			if (parent === undefined || index === undefined) return CONTINUE
			// Find all <!-- magicmark --> comments
			const commentMarker = parseCommentNode(node, parent, {
				closingPrefix,
				keywordPrefix,
				metaCommentIdentifier,
			})

			// Save the marker if it meets all criteria
			if (
				commentMarker !== undefined &&
				commentMarker.type === 'open' &&
				resolvedRules[commentMarker.keyword] !== undefined
			)
				commentMarkers.push(commentMarker)
		})

		// Sort by application order
		commentMarkers.sort(
			(a, b) =>
				resolvedRules[a.keyword].applicationOrder - resolvedRules[b.keyword].applicationOrder,
		)

		// Expand the rules
		for (const commentMarker of commentMarkers) {
			const { closingPrefix, keyword, keywordPrefix, node, parameters, parent } = commentMarker
			const rule = resolvedRules[keyword]

			let newMarkdownString = ''
			try {
				newMarkdownString = await rule.content(parameters ?? {}, tree)

				if (newMarkdownString === '') {
					file.message('Error running content rule', node)
				}
			} catch (error) {
				if (error instanceof Error) {
					file.message(error.message, node)
				}

				continue
			}

			// String to markdown Nodes
			const newNodes = remark().use(remarkGfm).parse(newMarkdownString).children

			// Add closing tag
			const closingNode: Html = {
				type: 'html',
				value: `<!-- ${closingPrefix}${keywordPrefix}${keyword} -->`,
			}

			const openingCommentIndex = parent.children.indexOf(node)
			parent.children.splice(openingCommentIndex + 1, 0, ...newNodes, closingNode)

			file.message(`Successfully Expanded ${keyword} comment`, node)
		}

		// Add meta comment
		if (addMetaComment) {
			const message = 'Warning: Content in HTML comment blocks generated by magicmark'
			const date = new Date().toISOString().slice(0, 10)
			const metaComment: Html = {
				type: 'html',
				value: `<!--${metaCommentIdentifier} ${message} on ${date} ${metaCommentIdentifier}-->`,
			}
			tree.children.unshift(metaComment)
		}
	}
}

export default expand
