import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import type { Rules } from '../src'
import remarkMdat, { mdatSplit, mdatStrip } from '../src'

async function stripString(markdown: string): Promise<string> {
	const result = await remark()
		.use(remarkGfm)
		.use(
			() =>
				function (tree: Root, file: VFile) {
					mdatSplit(tree, file)
					mdatStrip(tree, file)
				},
		)
		.process(markdown)
	return result.toString()
}

async function expandThenStrip(markdown: string, rules: Rules): Promise<string> {
	const expanded = await remark().use(remarkGfm).use(remarkMdat, { rules }).process(markdown)
	return stripString(expanded.toString())
}

describe('mdatStrip', () => {
	it('should strip mdat comments while preserving all code-style comments', async () => {
		const input = `# Comment Handling Test

<!-- // This is a developer note -->

## Section with hash comment

<!-- # TODO: Write better docs -->

Some content here.

<!-- #also-ignored -->

## Section with block comment

<!-- /* This is a block comment */ -->

## Keyword alongside code-style comments

<!-- // A note about the next keyword -->

<!-- basic -->

Stuff inside

<!-- /basic -->

stuff <!-- inline -->stuff inline<!-- /inline --> more stuff

<!-- # Another note -->

Bad closing tag

<!-- /basic -->



<!-- basic-dynamic -->
`
		const result = await stripString(input)
		// Code-style comments preserved
		expect(result).toMatchInlineSnapshot(`
			"# Comment Handling Test

			<!-- // This is a developer note -->

			## Section with hash comment

			<!-- # TODO: Write better docs -->

			Some content here.

			<!-- #also-ignored -->

			## Section with block comment

			<!-- /* This is a block comment */ -->

			## Keyword alongside code-style comments

			<!-- // A note about the next keyword -->

			Stuff inside

			stuff stuff inline more stuff

			<!-- # Another note -->

			Bad closing tag
			"
		`)
	})

	it('should strip expanded comments but keep inner content', async () => {
		const result = await expandThenStrip('<!-- keyword -->\n', { keyword: 'Hello world' })
		expect(result.trim()).toBe('Hello world')
	})

	it('should strip both opening and closing tags after expansion', async () => {
		const rules: Rules = { keyword: 'expanded content' }
		const result = await expandThenStrip('<!-- keyword -->\n', rules)
		expect(result).not.toContain('<!-- keyword -->')
		expect(result).not.toContain('<!-- /keyword -->')
		expect(result).toContain('expanded content')
	})

	it('should preserve surrounding content', async () => {
		const input = `# Header

Some intro.

<!-- keyword -->

More content.
`
		const result = await stripString(input)
		expect(result).toContain('# Header')
		expect(result).toContain('Some intro.')
		expect(result).toContain('More content.')
		expect(result).not.toContain('<!-- keyword -->')
	})

	it('should strip multiple expanded keywords', async () => {
		const rules: Rules = { a: 'Alpha', b: 'Beta' }
		const result = await expandThenStrip('<!-- a -->\n\n<!-- b -->\n', rules)
		expect(result).toContain('Alpha')
		expect(result).toContain('Beta')
		expect(result).not.toContain('<!-- a -->')
		expect(result).not.toContain('<!-- /a -->')
		expect(result).not.toContain('<!-- b -->')
		expect(result).not.toContain('<!-- /b -->')
	})

	it('should strip expanded compound rules keeping all content', async () => {
		const rules: Rules = { compound: ['Part one', 'Part two'] }
		const result = await expandThenStrip('<!-- compound -->\n', rules)
		expect(result).toContain('Part one')
		expect(result).toContain('Part two')
		expect(result).not.toContain('<!-- compound -->')
		expect(result).not.toContain('<!-- /compound -->')
	})

	it('should strip expanded keywords with options', async () => {
		const rules: Rules = {
			greet: (options) => `Hello, ${(options as { name: string }).name}!`,
		}
		const result = await expandThenStrip('<!-- greet({name: "Alice"}) -->\n', rules)
		expect(result).toContain('Hello, Alice!')
		expect(result).not.toContain('<!-- greet')
		expect(result).not.toContain('<!-- /greet -->')
	})

	it('should handle inline expanded content with surrounding markdown', async () => {
		const input = `# Title

Intro paragraph.

<!-- toc -->

<!-- badge -->

Footer text.
`
		const rules: Rules = {
			badge: '![status](https://img.shields.io/badge/status-ok-green)',
			toc: '- [Section 1](#s1)\n- [Section 2](#s2)',
		}
		const result = await expandThenStrip(input, rules)
		expect(result).toContain('# Title')
		expect(result).toContain('Intro paragraph.')
		expect(result).toContain('Section 1')
		expect(result).toContain('Section 2')
		expect(result).toContain('status-ok-green')
		expect(result).toContain('Footer text.')
		expect(result).not.toContain('<!-- toc -->')
		expect(result).not.toContain('<!-- badge -->')
		expect(result).not.toContain('<!-- /toc -->')
		expect(result).not.toContain('<!-- /badge -->')
	})

	it('should preserve all code-style comment types', async () => {
		const input = `<!-- // line comment -->\n<!-- # hash comment -->\n<!-- /* block comment */ -->\n`
		const result = await stripString(input)
		expect(result).toContain('<!-- // line comment -->')
		expect(result).toContain('<!-- # hash comment -->')
		expect(result).toContain('<!-- /* block comment */ -->')
	})

	it('should strip unexpanded mdat comments with options syntax', async () => {
		const result = await stripString('<!-- greet({name: "Alice"}) -->\n')
		expect(result.trim()).toBe('')
	})

	it('should handle document with no mdat comments', async () => {
		const input = `# Just markdown\n\nSome content.\n`
		const result = await stripString(input)
		expect(result.trim()).toBe('# Just markdown\n\nSome content.')
	})

	it('should be a no-op on empty document', async () => {
		const result = await stripString('')
		expect(result.trim()).toBe('')
	})
})
