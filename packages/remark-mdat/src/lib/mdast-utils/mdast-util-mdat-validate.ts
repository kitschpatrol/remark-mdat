import { saveLog } from '../mdat/mdat-log'
import { type CommentMarkerNode, parseCommentNode } from '../mdat/parse'
import { type NormalizedRule, type NormalizedRules, type Rules, loadRules } from '../mdat/rules'
import type { Root } from 'mdast'
import { table } from 'table'
import { CONTINUE, visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

export type Options = {
	addMetaComment: boolean
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
	rules: Array<Rules | string>
}

type CommentMarkerWithRule = CommentMarkerNode & {
	rule: NormalizedRule | undefined
}

/**
 * Mdast utility function to validate mdat source document, and output.
 */
export async function mdatValidate(tree: Root, file: VFile, options: Options) {
	const { closingPrefix, keywordPrefix, metaCommentIdentifier, rules } = options

	// Loading rules in both validate and expand is not great, but couldn't figure out async plugin setup
	// And this is arguably more portable
	const resolvedRules = await loadRules(rules)

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
					? resolvedRules[commentMarker.keyword]
					: undefined

			commentMarkers.push({
				...commentMarker,
				rule,
			})
		}
	})

	// Now run some validations

	// Error level checks
	checkMissingRequiredComments(file, commentMarkers, resolvedRules)
	checkCommentOrder(file, commentMarkers)
	checkMetaCommentPresence(file, commentMarkers, options)
	await checkRulesReturnedContent(file, commentMarkers, tree)

	// Warning level checks
	checkMissingOptionalComments(file, commentMarkers, resolvedRules)
	checkMissingRules(file, commentMarkers)
	checkMissingPrefix(file, commentMarkers, resolvedRules, options)
}

// Validation functions

/**
 * Check that all the rules are working by getting their content
 * TODO what about args?
 */
async function checkRulesReturnedContent(
	file: VFile,
	comments: CommentMarkerWithRule[],
	tree: Root,
) {
	for (const comment of comments) {
		if (comment.type === 'open' && comment.rule !== undefined) {
			try {
				const returnedContent = await comment.rule.content(comment.parameters, tree)

				if (returnedContent === '') {
					saveLog(file, 'error', 'check', `Returned empty string: ${comment.html}`, comment.node)
				}
			} catch (error) {
				if (error instanceof Error) {
					saveLog(file, 'error', 'check', `Error getting content: ${comment.html}`, comment.node)
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
	options: Options,
): void {
	if (options.keywordPrefix === '') return

	const ruleKeywords = Object.keys(rules)

	for (const comment of comments) {
		if (comment.type === 'native' && !ruleKeywords.includes(comment.content)) {
			saveLog(file, 'error', 'check', `Missing prefix: ${comment.html}`, comment.node)
		}
	}
}

/**
 * Check for missing "optional" rules. These are instances where we have the comment, but not the rule
 */
function checkMissingRules(file: VFile, comments: CommentMarkerWithRule[]): void {
	for (const comment of comments) {
		if (comment.type === 'open' && comment.rule === undefined) {
			saveLog(file, 'error', 'check', `Missing rule: ${comment.html}`, comment.node)
		}
	}
}

/**
 * Check for missing optional comments. We have defined the rule, but not written a matching comment.
 */
function checkMissingOptionalComments(
	file: VFile,
	comments: CommentMarkerWithRule[],
	rules: NormalizedRules,
): void {
	for (const [keyword, rule] of Object.entries(rules)) {
		if (
			!rule.required &&
			!comments.some((comment) => comment.type === 'open' && comment.keyword === keyword)
		) {
			saveLog(file, 'warn', 'check', `Missing optional: <!-- ${keyword} -->`)
		}
	}
}

/**
 * Check for missing required comments.
 * The rule set includes a rule with `required: true`, but no matching comment was found in the document.
 */
function checkMissingRequiredComments(
	file: VFile,
	comments: CommentMarkerWithRule[],
	rules: NormalizedRules,
): void {
	for (const [keyword, rule] of Object.entries(rules)) {
		if (
			rule.required &&
			!comments.some((comment) => comment.type === 'open' && comment.keyword === keyword)
		) {
			saveLog(file, 'warn', 'check', `Missing required: <!-- ${keyword} -->`)
		}
	}
}

/**
 * Check if comment order in document is different from order specified in the rules
 */
function checkCommentOrder(file: VFile, comments: CommentMarkerWithRule[]): void {
	const commentsInOrderOfAppearance = comments.filter(
		(commentMarker) => commentMarker.type === 'open' && commentMarker.rule?.order !== undefined,
	)

	const commentsInCorrectOrder = [...commentsInOrderOfAppearance].sort((a, b) => {
		if (a.rule?.order === undefined || b.rule?.order === undefined) {
			throw new Error('Unexpected undefined rule order')
		}

		return a.rule.order - b.rule.order
	})

	const currentOrderList = commentOrderList(commentsInOrderOfAppearance)
	const correctOrderList = commentOrderList(commentsInCorrectOrder)

	if (currentOrderList.join(',') !== correctOrderList.join(',')) {
		const tableData = currentOrderList.map((currentOrder, index) => [
			currentOrder,
			correctOrderList[index],
		])
		tableData.unshift(['Found', 'Expected'])

		const tableString = table(tableData, {})
		saveLog(file, 'error', 'check', `Out of order:\n${tableString}`)
	}
}

/**
 * Check that meta presence / absence comment matches options.
 */
function checkMetaCommentPresence(
	file: VFile,
	comments: CommentMarkerWithRule[],
	options: Options,
): void {
	const { addMetaComment } = options

	const metaCommentCount = comments.filter((comment) => comment.type === 'meta').length

	if (addMetaComment && metaCommentCount === 1) {
		saveLog(file, 'error', 'check', `Missing meta comment`)
	}

	if (!addMetaComment && metaCommentCount !== 0) {
		saveLog(file, 'error', 'check', `Unexpected meta comment`)
	}

	if (metaCommentCount > 1) {
		saveLog(file, 'error', 'check', `Multiple meta comments`)
	}
}

// Helpers

function commentOrderList(comments: CommentMarkerWithRule[]): string[] {
	return comments.map((comment, index) => {
		if (comment.type === 'open' || comment.type === 'close') {
			return `${index + 1}. ${comment.keyword}`
		}

		throw new Error('Unexpected comment type')
	})
}
