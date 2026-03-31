import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import type { NormalizedRule, NormalizedRules, Rules } from '../mdat/rules'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'
import { getRuleContent, normalizeRules, validateRules } from '../mdat/rules'

export type MdatCheckOptions = {
	addMetaComment: boolean | string
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
	rules: Rules
}

type CommentMarkerWithRule = CommentMarkerNode & {
	rule: NormalizedRule | undefined
}

/**
 * Mdast utility function to check mdat source document, and output.
 */
export async function mdatCheck(tree: Root, file: VFile, options: MdatCheckOptions) {
	const { closingPrefix, keywordPrefix, metaCommentIdentifier, rules: rawRules } = options

	validateRules(rawRules)
	const rules = normalizeRules(rawRules)

	// Collect all comment markers from the tree, including invalid ones
	// Order will be that of appearance in the document
	const commentMarkers: CommentMarkerWithRule[] = []
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE
		// Find all comments
		const commentMarker = parseCommentNode(node, parent, {
			closingPrefix,
			keywordPrefix,
			metaCommentIdentifier,
		})

		// Save the marker for validation functions
		if (commentMarker !== undefined) {
			// Pair the marker with its rule (if available) for ease of future use
			const rule =
				commentMarker.type === 'open' || commentMarker.type === 'close'
					? rules[commentMarker.keyword]
					: undefined

			commentMarkers.push({
				...commentMarker,
				rule,
			})
		}
	})

	// Now run some validations
	checkMetaCommentPresence(file, commentMarkers, options)
	await checkRulesReturnedContent(file, commentMarkers, tree)
	checkMissingRules(file, commentMarkers)
	checkMissingPrefix(file, commentMarkers, rules, options)
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
 * Check for comments with missing prefix (have an un-prefixed comment that matches a rule)
 */
function checkMissingPrefix(
	file: VFile,
	comments: CommentMarkerWithRule[],
	rules: NormalizedRules,
	options: MdatCheckOptions,
): void {
	if (options.keywordPrefix === '') return
	const ruleKeywords = Object.keys(rules)

	for (const comment of comments) {
		if (comment.type === 'native' && ruleKeywords.includes(comment.content)) {
			saveLog(file, 'warn', 'check', `Missing prefix: ${comment.html}`, comment.node)
		}
	}
}

/**
 * Check for missing "optional" rules. These are instances where we have the comment, but not the rule
 */
function checkMissingRules(file: VFile, comments: CommentMarkerWithRule[]): void {
	for (const comment of comments) {
		if (comment.type === 'open' && comment.rule === undefined) {
			saveLog(file, 'warn', 'check', `Missing rule for: ${comment.html}`, comment.node)
		}
	}
}

/**
 * Check that meta presence / absence comment matches options.
 */
function checkMetaCommentPresence(
	file: VFile,
	comments: CommentMarkerWithRule[],
	options: MdatCheckOptions,
): void {
	const { addMetaComment } = options

	const metaCommentCount = comments.filter((comment) => comment.type === 'meta').length
	const shouldHaveMetaComment = typeof addMetaComment === 'string' ? true : addMetaComment

	if (shouldHaveMetaComment && metaCommentCount !== 1) {
		saveLog(file, 'error', 'check', `Missing meta comment`)
	}

	if (!shouldHaveMetaComment && metaCommentCount !== 0) {
		saveLog(file, 'error', 'check', `Unexpected meta comment`)
	}

	if (metaCommentCount > 1) {
		saveLog(file, 'error', 'check', `Multiple meta comments`)
	}
}
