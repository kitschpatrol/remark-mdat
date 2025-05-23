/* eslint-disable jsdoc/require-jsdoc */

// @case-police-ignore Html

import type { Html, Root } from 'mdast'
import type { VFile } from 'vfile'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { CONTINUE, visit } from 'unist-util-visit'
import type { CommentMarkerNode } from '../mdat/parse'
import type { Rules } from '../mdat/rules'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'
import { getRuleContent, normalizeRules, validateRules } from '../mdat/rules'

export type Options = {
	addMetaComment: boolean
	closingPrefix: string
	keywordPrefix: string
	metaCommentIdentifier: string
	rules: Rules
}

type ValidCommentMarker = CommentMarkerNode & {
	type: 'close' | 'open'
}

/*
 * Mdast utility plugin to collapse mdat comments and strip generated meta
 * comments, effectively resetting the document to its original state.
 */
export async function mdatExpand(tree: Root, file: VFile, options: Options) {
	const {
		addMetaComment,
		closingPrefix,
		keywordPrefix,
		metaCommentIdentifier,
		rules: rawRules,
	} = options

	// Make the rules easier to deal with by normalizing to consistent structure
	validateRules(rawRules)
	const rules = normalizeRules(rawRules)

	// Get all valid comment markers from the tree
	const commentMarkers: ValidCommentMarker[] = []
	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE

		// Find all <!-- mdat --> comments
		const commentMarker = parseCommentNode(node, parent, {
			closingPrefix,
			keywordPrefix,
			metaCommentIdentifier,
		})

		// Save the marker if it meets all criteria
		if (
			commentMarker !== undefined &&
			commentMarker.type === 'open' &&
			// eslint-disable-next-line ts/no-unnecessary-condition
			rules[commentMarker.keyword] !== undefined
		)
			commentMarkers.push(commentMarker)
	})

	// Sort by application order
	commentMarkers.sort(
		(a, b) => rules[a.keyword].applicationOrder - rules[b.keyword].applicationOrder,
	)

	// Expand the rules
	for (const comment of commentMarkers) {
		const { closingPrefix, html, keyword, keywordPrefix, node, options, parent } = comment
		const rule = rules[keyword]

		let newMarkdownString = ''
		try {
			// Handle compound rules
			newMarkdownString = await getRuleContent(rule, options, tree)

			// TODO just let check get this?
			if (newMarkdownString.trim() === '') {
				saveLog(file, 'error', 'expand', `Got empty content when expanding ${html}`, node)
			}
		} catch (error) {
			if (error instanceof Error) {
				saveLog(
					file,
					'error',
					'expand',
					`Caught error expanding ${html}, Error message: "${error.message}"`,
					node,
				)
			}

			continue
		}

		// String to Markdown Nodes
		// TODO Consider exposing this for more complex use cases?
		const newNodes = remark().use(remarkGfm).parse(newMarkdownString).children

		// Add closing tag
		const closingNode: Html = {
			type: 'html',
			value: `<!-- ${closingPrefix}${keywordPrefix}${keyword} -->`,
		}

		const openingCommentIndex = parent.children.indexOf(node)
		parent.children.splice(openingCommentIndex + 1, 0, ...newNodes, closingNode)

		saveLog(file, 'info', 'expand', `Expanded: ${html}`, node)
	}

	// Add meta comment
	if (addMetaComment) {
		const message =
			'Warning: Content inside HTML comment blocks was generated by mdat and may be overwritten.'
		const metaComment: Html = {
			type: 'html',
			value: `<!--${metaCommentIdentifier} ${message} ${metaCommentIdentifier}-->`,
		}
		tree.children.unshift(metaComment)
	}
}
