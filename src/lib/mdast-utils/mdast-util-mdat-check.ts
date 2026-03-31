import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import type { NormalizedRule, Rules } from '../mdat/rules'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'
import { getRuleContent, normalizeRules, validateRules } from '../mdat/rules'

type CommentMarkerWithRule = CommentMarkerNode & {
	rule: NormalizedRule | undefined
}

/**
 * Mdast utility function to check mdat source document, and output.
 */
export async function mdatCheck(tree: Root, file: VFile, rules: Rules) {
	validateRules(rules)
	const normalizedRules = normalizeRules(rules)

	// Collect all comment markers from the tree, including invalid ones
	// Order will be that of appearance in the document
	const commentMarkers: CommentMarkerWithRule[] = []
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE
		// Find all comments
		const commentMarker = parseCommentNode(node, parent)

		// Save the marker for validation functions
		if (commentMarker !== undefined) {
			commentMarkers.push({
				...commentMarker,
				rule: normalizedRules[commentMarker.keyword],
			})
		}
	})

	// Now run some validations
	await checkRulesReturnedContent(file, commentMarkers, tree)
	checkMissingRules(file, commentMarkers)
}

// Validation functions

/**
 * Check that all the rules are working by getting their content
 */
async function checkRulesReturnedContent(
	file: VFile,
	comments: CommentMarkerWithRule[],
	tree: Root,
) {
	for (const comment of comments) {
		if (comment.type === 'open' && comment.rule !== undefined) {
			try {
				const returnedContent = await getRuleContent(comment.rule, comment.options, tree, true)

				if (returnedContent.trim() === '') {
					saveLog(file, 'warn', 'check', `${comment.html} returned an empty string.`, comment.node)
				}
			} catch (error) {
				if (error instanceof Error) {
					saveLog(
						file,
						'warn',
						'check',
						`Could not get content for ${comment.html}. ${error.message}`,
						comment.node,
					)
				}
			}
		}
	}
}

/**
 * Check for missing rules. We have the comment, but not the rule.
 */
function checkMissingRules(file: VFile, comments: CommentMarkerWithRule[]): void {
	for (const comment of comments) {
		if (comment.type === 'open' && comment.rule === undefined) {
			saveLog(file, 'warn', 'check', `Missing rule for: ${comment.html}`, comment.node)
		}
	}
}
