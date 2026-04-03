// @case-police-ignore Html

import type { Html, Root } from 'mdast'
import type { VFile } from 'vfile'
import { matter } from 'gray-matter-es'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import type { NormalizedRules, RuleContext, Rules } from '../mdat/rules'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'
import { getRuleContent, isNormalized, normalizeRules } from '../mdat/rules'

/**
 * Mdast utility to expand mdat comments in the tree.
 */
export async function mdatExpand(tree: Root, file: VFile, rules: NormalizedRules | Rules) {
	// Skip normalization if rules are already normalized (e.g. from plugin init)

	const normalizedRules = isNormalized(rules) ? rules : normalizeRules(rules)

	// Build context for rule content functions

	const frontmatter: Record<string, unknown> | undefined = (() => {
		if (typeof file.value !== 'string') return
		const { data } = matter(file.value)
		return Object.keys(data).length > 0 ? data : undefined
	})()

	const filePath = file.history.length > 0 ? file.path : undefined
	const context: RuleContext = { filePath, frontmatter, tree }

	// Get all valid comment markers from the tree
	const commentMarkers: CommentMarkerNode[] = []
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE

		// Find all <!-- mdat --> comments
		const commentMarker = parseCommentNode(node, parent)

		if (commentMarker?.type !== 'open') return CONTINUE

		// eslint-disable-next-line ts/no-unnecessary-condition
		if (normalizedRules[commentMarker.keyword] === undefined) {
			saveLog(file, 'warn', 'expand', `Missing rule for: ${commentMarker.html}`, node)
			return CONTINUE
		}

		commentMarkers.push(commentMarker)
	})

	// Sort by order
	commentMarkers.sort((a, b) => normalizedRules[a.keyword].order - normalizedRules[b.keyword].order)

	// Reuse a single parser for all comment expansions
	const parser = remark().use(remarkGfm)

	// Expand the rules
	for (const comment of commentMarkers) {
		const { html, keyword, node, options, parent } = comment
		const rule = normalizedRules[keyword]

		let newMarkdownString = ''
		try {
			// Handle compound rules
			newMarkdownString = await getRuleContent(rule, options, context, (warning) => {
				saveLog(file, 'warn', 'expand', `${html}: ${warning}`, node)
			})

			if (newMarkdownString.trim() === '') {
				saveLog(file, 'error', 'expand', `Got empty content when expanding ${html}`, node)
			}
		} catch (error) {
			// Defensive: getRuleContent always throws Error
			if (error instanceof Error) {
				const causeMessage = error.cause instanceof Error ? `: ${error.cause.message}` : ''
				saveLog(
					file,
					'error',
					'expand',
					`Caught error expanding ${html}, Error message: "${error.message}${causeMessage}"`,
					node,
				)
			}

			continue
		}

		// String to Markdown Nodes
		// TODO Consider exposing this for more complex use cases?
		const newNodes = parser.parse(newMarkdownString).children

		// Add closing tag
		const closingNode: Html = {
			type: 'html',
			value: `<!-- /${keyword} -->`,
		}

		const openingCommentIndex = parent.children.indexOf(node)
		parent.children.splice(openingCommentIndex + 1, 0, ...newNodes, closingNode)

		saveLog(file, 'info', 'expand', `Expanded: ${html}`, node)
	}
}
