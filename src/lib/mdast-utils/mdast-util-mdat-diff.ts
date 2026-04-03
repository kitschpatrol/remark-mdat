import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { CONTINUE, visit } from 'unist-util-visit'
import { saveLog } from '../mdat/mdat-log'
import { parseCommentNode } from '../mdat/parse'

/** Per-tag comparison result from {@link mdatDiff}. */
export type MdatDiffResult = {
	/** The keyword for this tag. */
	keyword: string
	/** 1-based line number of the opening comment in the expanded document. */
	line: number
	/** Comparison status. */
	status: 'added' | 'missing' | 'ok' | 'stale' | 'unexpanded'
}

type TagSection = {
	content: string | undefined
	keyword: string
	line: number
}

/**
 * Compare original and expanded documents per-tag. Walks both ASTs to extract
 * content between open/close comment markers, then compares per-tag.
 *
 * Callers should run {@link mdatSplit} on both trees before calling this
 * function to ensure multi-comment nodes are split into individual nodes.
 *
 * Adds diagnostic messages to `expandedFile` via the VFile message pipeline.
 *
 * @returns Per-tag comparison results.
 */
export function mdatDiff(
	originalTree: Root,
	originalFile: VFile,
	expandedTree: Root,
	expandedFile: VFile,
): MdatDiffResult[] {
	const originalText = originalFile.toString()
	const expandedText = expandedFile.toString()

	const originalSections = extractSections(originalTree, originalText, originalFile)
	const expandedSections = extractSections(expandedTree, expandedText, expandedFile)

	const results: MdatDiffResult[] = []

	// Group by keyword for positional matching
	const originalByKeyword = groupByKeyword(originalSections)
	const expandedByKeyword = groupByKeyword(expandedSections)

	// Compare tags found in the expanded version
	for (const [keyword, expandedList] of expandedByKeyword) {
		const originalList = originalByKeyword.get(keyword) ?? []

		for (const [i, exp] of expandedList.entries()) {
			const orig = originalList.at(i)

			if (orig === undefined) {
				results.push({ keyword, line: exp.line, status: 'added' })
				saveLog(expandedFile, 'info', 'diff', `Added: <!-- ${keyword} -->`, exp.line)
			} else if (orig.content === undefined) {
				results.push({ keyword, line: exp.line, status: 'unexpanded' })
				saveLog(expandedFile, 'warn', 'diff', `Unexpanded: <!-- ${keyword} -->`, exp.line)
			} else if (orig.content === exp.content) {
				results.push({ keyword, line: exp.line, status: 'ok' })
				saveLog(expandedFile, 'info', 'diff', `Up to date: <!-- ${keyword} -->`, exp.line)
			} else {
				results.push({ keyword, line: exp.line, status: 'stale' })
				saveLog(expandedFile, 'warn', 'diff', `Stale: <!-- ${keyword} -->`, exp.line)
			}
		}
	}

	// Detect tags present in original but missing from expanded
	for (const [keyword, originalList] of originalByKeyword) {
		const expandedList = expandedByKeyword.get(keyword) ?? []
		for (const orig of originalList.slice(expandedList.length)) {
			results.push({ keyword, line: orig.line, status: 'missing' })
			saveLog(expandedFile, 'warn', 'diff', `Missing: <!-- ${keyword} -->`, orig.line)
		}
	}

	return results
}

// Helpers

function extractSections(tree: Root, text: string, file: VFile): TagSection[] {
	const sections: TagSection[] = []
	let lastOpenKeyword: string | undefined
	let lastOpenLine = 0
	let lastOpenEndOffset: number | undefined

	visit(tree, 'html', (node, index, parent) => {
		if (parent === undefined || index === undefined) return CONTINUE

		const marker = parseCommentNode(node, parent)

		if (marker === undefined) return CONTINUE

		if (marker.type === 'open') {
			// If there was a previous unmatched open, record it as unexpanded
			if (lastOpenKeyword !== undefined) {
				sections.push({
					content: undefined,
					keyword: lastOpenKeyword,
					line: lastOpenLine,
				})
			}

			lastOpenKeyword = marker.keyword

			lastOpenLine = marker.node.position?.start.line ?? 0
			lastOpenEndOffset = marker.node.position?.end.offset
			return CONTINUE
		}

		// If marker.type === 'close'

		if (lastOpenKeyword === undefined) {
			saveLog(file, 'warn', 'diff', `Close marker without open: <!-- /${marker.keyword} -->`, node)
			return CONTINUE
		}

		if (lastOpenKeyword !== marker.keyword) {
			saveLog(
				file,
				'warn',
				'diff',
				`Keyword mismatch: expected <!-- /${lastOpenKeyword} -->, found <!-- /${marker.keyword} -->`,
				node,
			)
			return CONTINUE
		}

		const closeStartOffset = marker.node.position?.start.offset
		// Defensive: parsed html nodes always have positions
		const sliced =
			closeStartOffset === undefined || lastOpenEndOffset === undefined
				? undefined
				: text.slice(lastOpenEndOffset, closeStartOffset).replaceAll('\r\n', '\n').trim()
		const content = sliced === '' ? undefined : sliced

		sections.push({
			content,
			keyword: lastOpenKeyword,
			line: lastOpenLine,
		})

		lastOpenKeyword = undefined
		lastOpenEndOffset = undefined

		return CONTINUE
	})

	// Handle trailing unmatched open
	if (lastOpenKeyword !== undefined) {
		sections.push({
			content: undefined,
			keyword: lastOpenKeyword,
			line: lastOpenLine,
		})
	}

	return sections
}

function groupByKeyword(sections: TagSection[]): Map<string, TagSection[]> {
	const map = new Map<string, TagSection[]>()
	for (const section of sections) {
		const list = map.get(section.keyword)
		if (list) {
			list.push(section)
		} else {
			map.set(section.keyword, [section])
		}
	}

	return map
}
