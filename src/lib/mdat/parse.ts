// @case-police-ignore Html

import type { Html, Parent } from 'mdast'
import type { JsonValue, Simplify } from 'type-fest'
import json5 from 'json5'
import { VFileMessage } from 'vfile-message'

/**
 * Structured data about a parsed comment.
 */
type CommentMarker = Simplify<{
	/** The complete original comment, e.g. `<!-- keyword -->`  */
	html: string
	/** The first complete word in the comment  */
	keyword: string
	/** Parsed JSON object of argument string that followed the keyword, empty object if nothing passed  */
	options: JsonValue
	/**
	 * `open`: A mdat-style opening comment tag, e.g. `<!-- keyword -->`  \
	 * `close`: A mdat-style closing comment tag, e.g. `<!-- /keyword -->`
	 */
	type: 'close' | 'open'
}>

/**
 * Parsed comment with additional information about the Mdast Node and its Parent.
 */
export type CommentMarkerNode = Simplify<
	CommentMarker & {
		/** Original Mdast HTML Node where the comment was found. */
		node: Html
		/** Parent of original Mdast HTML Node where the comment was found. */
		parent: Parent
	}
>

/**
 * Parse an Mdast HTML comment node into structured data.
 * @returns A CommentMarkerNode or undefined if the node is not a recognized comment.
 */
export function parseCommentNode(node: Html, parent: Parent): CommentMarkerNode | undefined {
	try {
		const result = parseComment(node.value)

		if (result === undefined) {
			return undefined
		}

		return {
			...result,
			node,
			parent,
		}
	} catch (error) {
		if (error instanceof VFileMessage) {
			error.line = node.position?.start.line
			throw error
		} else if (error instanceof Error) {
			throw new VFileMessage(error.message, node)
		} else {
			throw new VFileMessage('Unknown error', node)
		}
	}
}

/**
 * Parse any comment string into structured data.
 * Comments using code-style notation (`//`, `#`, `/*`) are ignored and return `undefined`.
 * @returns A CommentMarker or undefined if the node is not a recognized comment.
 */
export function parseComment(text: string): CommentMarker | undefined {
	if (!isComment(text)) return

	const closingPrefix = '/'

	const commentHtml = text.trim()
	const commentBody = commentHtml.replace(/^\s*<!-{2,}\s*/, '').replace(/\s*-{2,}>\s*$/, '')

	// Splits without capturing
	const [rawKeyword, ...argumentParts] = commentBody.split(/(\s+|\(|\{)/)

	// Ignore code-style comments embedded in HTML comments
	if (rawKeyword.startsWith('//') || rawKeyword.startsWith('#') || rawKeyword.startsWith('/*')) {
		return undefined
	}

	const type = rawKeyword.startsWith(closingPrefix) ? 'close' : 'open'

	// Strip closing prefix
	let keyword = rawKeyword
	if (type === 'close') {
		keyword = keyword.slice(closingPrefix.length)
	}

	const optionText = makeValidJson(argumentParts.join(''))

	let options: JsonValue = {}

	try {
		options = json5.parse<JsonValue>(optionText)
	} catch (error) {
		if (error instanceof Error) {
			throw new VFileMessage(
				`Failed to parse comment options "${optionText}" for keyword "${keyword}": ${error.message}`,
			)
		}
	}

	return {
		html: commentHtml,
		keyword,
		options,
		type,
	}
}

function isComment(text: string): boolean {
	const trimmed = text.trim()
	return trimmed.startsWith('<!--') && trimmed.endsWith('-->')
}

// Let the user pass the comment options inside parentheses if they want, like a function call
// Or let them skip the brackets if they want
function makeValidJson(text: string): string {
	// Remove parentheses
	text = text.trim()
	text = text.startsWith('(') ? text.slice(1) : text
	text = text.endsWith(')') ? text.slice(0, -1) : text
	text = text.trim()

	// Make bare objects valid JSON
	if (!text.startsWith('{') && !text.startsWith('[')) text = '{' + text
	if (!text.endsWith('}') && !text.endsWith(']')) text += '}'
	return text
}
