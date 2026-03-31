/* eslint-disable jsdoc/require-jsdoc */
import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import fs from 'node:fs/promises'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import type { Rules } from '../src'
import remarkMdat, { mdatClean, mdatSplit } from '../src'
import testRules from './assets/test-rules'
import testRulesInvalid from './assets/test-rules-invalid'

async function expandStringToString(markdown: string, rules: Rules): Promise<string> {
	const result = await remark().use(remarkGfm).use(remarkMdat, rules).process(markdown)
	return result.toString()
}

// Export for linter
export async function cleanString(markdown: string): Promise<string> {
	const result = await remark()
		.use(remarkGfm)
		.use(
			() =>
				// eslint-disable-next-line unicorn/consistent-function-scoping
				function (tree: Root, file: VFile) {
					mdatSplit(tree, file)
					mdatClean(tree, file)
				},
		)
		.process(markdown)
	return result.toString()
}

async function expandFileToString(file: string, rules: Rules): Promise<string> {
	const buffer = await fs.readFile(file)
	const result = await remark().use(remarkGfm).use(remarkMdat, rules).process(buffer)
	return result.toString()
}

describe('comment expansion', () => {
	it('should expand comments', async () => {
		const expandedString = await expandFileToString('./test/assets/test-document.md', testRules)
		expect(expandedString).toMatchSnapshot()
	})

	it('should be idempotent', async () => {
		const firstPass = await expandFileToString('./test/assets/test-document.md', testRules)
		const secondPass = await expandStringToString(firstPass, testRules)
		expect(firstPass).toEqual(secondPass)
	})

	it('should throw an error if rule set is invalid', async () => {
		await expect(
			// @ts-expect-error intentionally invalid rules for runtime validation test
			expandFileToString('./test/assets/test-document.md', testRulesInvalid),
		).rejects.toThrow()
	})

	it('should expand keywords while ignoring code-style comments', async () => {
		const expandedString = await expandFileToString(
			'./test/assets/test-document-comments.md',
			testRules,
		)
		expect(expandedString).toMatchSnapshot()
	})
})

describe('code-style comment handling', () => {
	it('should leave code-style comments untouched during expansion', async () => {
		const markdown = `<!-- // developer note -->\n<!-- # todo -->\n<!-- /* block */ -->\n<!-- keyword -->\n`
		const result = await expandStringToString(markdown, { keyword: 'expanded' })
		expect(result).toContain('<!-- // developer note -->')
		expect(result).toContain('<!-- # todo -->')
		expect(result).toContain('<!-- /* block */ -->')
		expect(result).toContain('<!-- /keyword -->')
	})

	it('should not confuse closing tags with line comments', async () => {
		const markdown = `<!-- keyword -->\n`
		const result = await expandStringToString(markdown, { keyword: 'content' })
		expect(result).toContain('<!-- /keyword -->')
	})
})

describe('keyword validation', () => {
	it('should reject keywords starting with /', async () => {
		await expect(expandStringToString('<!-- test -->', { '/bad': 'nope' })).rejects.toThrow(
			'Rule keywords must not start with',
		)
	})

	it('should reject keywords starting with #', async () => {
		await expect(expandStringToString('<!-- test -->', { '#bad': 'nope' })).rejects.toThrow(
			'Rule keywords must not start with',
		)
	})

	it('should reject keywords starting with *', async () => {
		await expect(expandStringToString('<!-- test -->', { '*bad': 'nope' })).rejects.toThrow(
			'Rule keywords must not start with',
		)
	})
})

describe('keyword case sensitivity', () => {
	it('should treat comment expansion keywords as case sensitive', async () => {
		const markdown = `<!-- KEYWORD -->\n<!-- kEyWoRd -->\n<!-- keyword -->\n`
		const rules: Rules = {
			// eslint-disable-next-line ts/naming-convention
			KEYWORD: "I'm yelling",
			kEyWoRd: "I'm emotional",
			keyword: "I'm basic",
		}
		const expandedString = await expandStringToString(markdown, rules)
		expect(expandedString).toMatchInlineSnapshot(`
			"<!-- KEYWORD -->

			I'm yelling

			<!-- /KEYWORD -->

			<!-- kEyWoRd -->

			I'm emotional

			<!-- /kEyWoRd -->

			<!-- keyword -->

			I'm basic

			<!-- /keyword -->
			"
		`)
	})
})

describe('compound rule handling', () => {
	it('should expand compound rules', async () => {
		const markdown = `<!-- compoundKeyword -->\n`
		const expandedString = await expandStringToString(markdown, {
			compoundKeyword: ['one', 'two', 'three'],
		})
		expect(expandedString).toMatchInlineSnapshot(`
			"<!-- compoundKeyword -->

			one

			two

			three

			<!-- /compoundKeyword -->
			"
		`)
	})

	it('should pass option arrays to compound rules', async () => {
		const markdown = `<!-- compound [{option: 'yes'}, {option: 'it'}, {option: 'can'}] -->\n`
		const expandedString = await expandStringToString(markdown, {
			compound: [
				// eslint-disable-next-line ts/no-unsafe-type-assertion
				(options) => `My option is: ${(options as { option: string }).option}`,
				// eslint-disable-next-line ts/no-unsafe-type-assertion
				(options) => `My option is: ${(options as { option: string }).option}`,
				// eslint-disable-next-line ts/no-unsafe-type-assertion
				(options) => `My option is: ${(options as { option: string }).option}`,
			],
		})
		expect(expandedString).toMatchInlineSnapshot(`
			"<!-- compound [{option: 'yes'}, {option: 'it'}, {option: 'can'}] -->

			My option is: yes

			My option is: it

			My option is: can

			<!-- /compound -->
			"
		`)
	})
})
