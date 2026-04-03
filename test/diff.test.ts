import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { VFile } from 'vfile'
import { describe, expect, it } from 'vitest'
import { mdatDiff, mdatSplit } from '../src'

function prepareDiff(originalText: string, expandedText: string) {
	const parser = remark().use(remarkGfm)

	const originalTree = parser.parse(originalText)
	const originalFile = new VFile(originalText)
	mdatSplit(originalTree, originalFile)

	const expandedTree = parser.parse(expandedText)
	const expandedFile = new VFile(expandedText)
	mdatSplit(expandedTree, expandedFile)

	return { expandedFile, expandedTree, originalFile, originalTree }
}

describe('mdatDiff', () => {
	it('should return ok when both texts are identical', () => {
		const text = '<!-- keyword -->\n\nsome content\n\n<!-- /keyword -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(text, text)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([{ keyword: 'keyword', line: 1, status: 'ok' }])
	})

	it('should detect stale tag content', () => {
		const original = '<!-- title -->\n\n# Old Title\n\n<!-- /title -->'
		const expanded = '<!-- title -->\n\n# New Title\n\n<!-- /title -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([{ keyword: 'title', line: 1, status: 'stale' }])
	})

	it('should detect unexpanded tags', () => {
		const original = '<!-- title -->'
		const expanded = '<!-- title -->\n\n# Title\n\n<!-- /title -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([{ keyword: 'title', line: 1, status: 'unexpanded' }])
	})

	it('should handle multiple tags with mixed statuses', () => {
		const original = [
			'<!-- a -->',
			'',
			'same content',
			'',
			'<!-- /a -->',
			'',
			'<!-- b -->',
			'',
			'old content',
			'',
			'<!-- /b -->',
			'',
			'<!-- c -->',
		].join('\n')

		const expanded = [
			'<!-- a -->',
			'',
			'same content',
			'',
			'<!-- /a -->',
			'',
			'<!-- b -->',
			'',
			'new content',
			'',
			'<!-- /b -->',
			'',
			'<!-- c -->',
			'',
			'expanded c',
			'',
			'<!-- /c -->',
		].join('\n')

		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([
			{ keyword: 'a', line: 1, status: 'ok' },
			{ keyword: 'b', line: 7, status: 'stale' },
			{ keyword: 'c', line: 13, status: 'unexpanded' },
		])
	})

	it('should handle multiple occurrences of the same keyword', () => {
		const original = [
			'<!-- tag -->',
			'',
			'first',
			'',
			'<!-- /tag -->',
			'',
			'<!-- tag -->',
			'',
			'second',
			'',
			'<!-- /tag -->',
		].join('\n')

		const expanded = [
			'<!-- tag -->',
			'',
			'first',
			'',
			'<!-- /tag -->',
			'',
			'<!-- tag -->',
			'',
			'changed',
			'',
			'<!-- /tag -->',
		].join('\n')

		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([
			{ keyword: 'tag', line: 1, status: 'ok' },
			{ keyword: 'tag', line: 7, status: 'stale' },
		])
	})

	it('should add warn messages for stale tags to expanded VFile', () => {
		const original = '<!-- title -->\n\n# Old\n\n<!-- /title -->'
		const expanded = '<!-- title -->\n\n# New\n\n<!-- /title -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		mdatDiff(originalTree, originalFile, expandedTree, expandedFile)

		const warnMessages = expandedFile.messages.filter((m) => m.fatal === false)
		expect(warnMessages).toHaveLength(1)
		expect(warnMessages[0].reason).toContain('Stale')
		expect(warnMessages[0].reason).toContain('title')
		expect(warnMessages[0].source).toBe('diff')
	})

	it('should add info messages for up-to-date tags', () => {
		const text = '<!-- keyword -->\n\ncontent\n\n<!-- /keyword -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(text, text)
		mdatDiff(originalTree, originalFile, expandedTree, expandedFile)

		const infoMessages = expandedFile.messages.filter((m) => m.fatal === undefined)
		expect(infoMessages).toHaveLength(1)
		expect(infoMessages[0].reason).toContain('Up to date')
	})

	it('should handle CRLF normalization', () => {
		const original = '<!-- tag -->\r\n\r\ncontent\r\n\r\n<!-- /tag -->'
		const expanded = '<!-- tag -->\n\ncontent\n\n<!-- /tag -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([{ keyword: 'tag', line: 1, status: 'ok' }])
	})

	it('should detect tags present in original but missing from expanded', () => {
		const original = [
			'<!-- a -->',
			'',
			'content a',
			'',
			'<!-- /a -->',
			'',
			'<!-- b -->',
			'',
			'content b',
			'',
			'<!-- /b -->',
		].join('\n')

		const expanded = ['<!-- a -->', '', 'content a', '', '<!-- /a -->'].join('\n')

		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([
			{ keyword: 'a', line: 1, status: 'ok' },
			{ keyword: 'b', line: 7, status: 'missing' },
		])
	})

	it('should detect missing when same keyword has fewer occurrences in expanded', () => {
		const original = [
			'<!-- tag -->',
			'',
			'first',
			'',
			'<!-- /tag -->',
			'',
			'<!-- tag -->',
			'',
			'second',
			'',
			'<!-- /tag -->',
		].join('\n')

		const expanded = ['<!-- tag -->', '', 'first', '', '<!-- /tag -->'].join('\n')

		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([
			{ keyword: 'tag', line: 1, status: 'ok' },
			{ keyword: 'tag', line: 7, status: 'missing' },
		])
	})

	it('should treat empty-but-closed tags as unexpanded tags', () => {
		const original = '<!-- tag --><!-- /tag -->'
		const expanded = '<!-- tag -->\n\ncontent\n\n<!-- /tag -->'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(
			original,
			expanded,
		)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		// Empty-but-closed is stale (not unexpanded), because it has a closing tag
		expect(results).toEqual([{ keyword: 'tag', line: 1, status: 'unexpanded' }])
	})

	it('should handle document with no mdat tags', () => {
		const text = '# Just a heading\n\nSome text.'
		const { expandedFile, expandedTree, originalFile, originalTree } = prepareDiff(text, text)
		const results = mdatDiff(originalTree, originalFile, expandedTree, expandedFile)
		expect(results).toEqual([])
	})
})
