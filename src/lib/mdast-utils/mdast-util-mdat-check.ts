/* eslint-disable import/no-named-as-default */

import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import Table from 'cli-table3'
import picocolors from 'picocolors'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import type { NormalizedRule, NormalizedRules, Rule, Rules } from '../mdat/rules'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'
import { getRuleContent, normalizeRules, validateRules } from '../mdat/rules'

export type Options = {
	addMetaComment: boolean | string
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
	/** Enable extra checks, too noisy for real life. */
	paranoid: boolean
	rules: Rules
}

type CommentMarkerWithRule = CommentMarkerNode & {
	rule: NormalizedRule | undefined
}

/**
 * Mdast utility function to check mdat source document, and output.
 */
export async function mdatCheck(tree: Root, file: VFile, options: Options) {
	const { closingPrefix, keywordPrefix, metaCommentIdentifier, paranoid, rules: rawRules } = options

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

	// Error level checks
	checkMissingRequiredComments(file, commentMarkers, rules, rawRules)
	checkCommentOrder(file, commentMarkers)
	checkMetaCommentPresence(file, commentMarkers, options)
	await checkRulesReturnedContent(file, commentMarkers, tree)

	// Warning level checks
	if (paranoid) {
		checkMissingOptionalComments(file, commentMarkers, rules, rawRules) // Too annoying
	}

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
					saveLog(
						file,
						comment.rule.required ? 'error' : 'warn',
						'check',
						`${comment.html} returned an empty string.`,
						comment.node,
					)
				}
			} catch (error) {
				if (error instanceof Error) {
					saveLog(
						file,
						comment.rule.required ? 'error' : 'warn',
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
	options: Options,
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
 * Check for missing optional comments. We have defined the rule, but not written a matching comment.
 */
function checkMissingOptionalComments(
	file: VFile,
	comments: CommentMarkerWithRule[],
	rules: NormalizedRules,
	rawRules: Rules,
): void {
	for (const [keyword, rule] of Object.entries(rules)) {
		if (
			!rule.required &&
			!comments.some((comment) => comment.type === 'open' && comment.keyword === keyword) &&
			!satisfiedByCompoundRule(keyword, rawRules)
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
	rawRules: Rules,
): void {
	for (const [keyword, rule] of Object.entries(rules)) {
		// Compound rules don't get comments
		if (
			rule.required &&
			!comments.some((comment) => comment.type === 'open' && comment.keyword === keyword) &&
			!satisfiedByCompoundRule(keyword, rawRules)
		) {
			saveLog(file, 'error', 'check', `Missing required: <!-- ${keyword} -->`)
		}
	}
}

/**
 * Extract the content value from a raw rule, unwrapping object-form rules.
 */
function getRawRuleContent(rule: Rule): Rule {
	if (typeof rule === 'object' && !Array.isArray(rule)) {
		return rule.content
	}

	return rule
}

/**
 * Get the sub-rule array from a compound rule, if it is one.
 */
function getCompoundSubRules(rule: Rule): Rule[] | undefined {
	if (Array.isArray(rule)) return rule
	if (typeof rule === 'object' && !Array.isArray(rule) && Array.isArray(rule.content)) {
		return rule.content
	}

	return undefined
}

/**
 * Helper to see if a rule keyword is covered by a compound rule in the rule set.
 * Checks whether any compound rule contains the same raw content value (by reference)
 * as the rule for the given keyword. This works when the sub-rule was imported
 * directly into the compound rule definition.
 */
function satisfiedByCompoundRule(keyword: string, rawRules: Rules): boolean {
	const rawRule = rawRules[keyword]
	const ruleContent = getRawRuleContent(rawRule)

	for (const otherRule of Object.values(rawRules)) {
		const subRules = getCompoundSubRules(otherRule)
		if (subRules === undefined) continue

		// Check if any sub-rule matches the content by reference
		if (subRules.some((subRule) => getRawRuleContent(subRule) === ruleContent)) {
			return true
		}
	}

	return false
}

/**
 * Check if comment order in document is different from order specified in the rules
 */
function checkCommentOrder(file: VFile, comments: CommentMarkerWithRule[]): void {
	const commentsInOrderOfAppearance = comments.filter(
		(commentMarker) => commentMarker.type === 'open' && commentMarker.rule?.order !== undefined,
	)

	const commentsInCorrectOrder = [...commentsInOrderOfAppearance].toSorted((a, b) => {
		const orderA = a.rule?.order
		const orderB = b.rule?.order

		if (orderA === undefined || orderB === undefined) {
			throw new Error('Unexpected undefined rule order')
		}

		return orderA - orderB
	})

	const currentOrderList = commentOrderList(commentsInOrderOfAppearance)
	const correctOrderList = commentOrderList(commentsInCorrectOrder)

	const table = new Table({
		head: [
			picocolors.red(picocolors.bold('Current Order')),
			picocolors.green(picocolors.bold('Required Order')),
		],
		style: {
			compact: true,
		},
	})

	if (currentOrderList.join(',') !== correctOrderList.join(',')) {
		table.push(
			...currentOrderList.map((currentOrder, index) => [currentOrder, correctOrderList[index]]),
		)

		saveLog(file, 'error', 'check', `Out of order:\n${table.toString()}`)
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

// Helpers

function commentOrderList(comments: CommentMarkerWithRule[]): string[] {
	return comments.map((comment, index) => {
		if (comment.type === 'open' || comment.type === 'close') {
			return `${index + 1}. ${comment.html}`
		}

		throw new Error('Unexpected comment type')
	})
}
