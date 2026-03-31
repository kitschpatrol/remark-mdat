import type { VFile } from 'vfile'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import type { Rules } from '../src'
import remarkMdat from '../src'

async function expandStringToVfile(markdown: string, rules: Rules): Promise<VFile> {
	return remark().use(remarkGfm).use(remarkMdat, rules).process(markdown)
}

function stripAnsiEscapeCodes(text: string): string {
	// This regex matches the escape sequences and removes them
	// eslint-disable-next-line no-control-regex
	const ansiEscapeRegex = /\u001B\[[\d;]*m/g
	return text.replaceAll(ansiEscapeRegex, '')
}

const rules: Rules = {
	'first-expansion': 'This is first',
	'optional-expansion': 'This is optional',
	'second-expansion': 'This is second',
}

describe('check validation', () => {
	it('should not report errors when valid', async () => {
		const markdown = `<!-- first-expansion -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, rules)
		const foundError = result.messages.some((message) => message.fatal === true)
		expect(foundError).toBeFalsy()
	})

	it('should warn when rules return nothing', async () => {
		const badRules: Rules = {
			...rules,
			'rule-that-returns-nothing': '',
		}
		const markdown = `<!-- first-expansion -->\n<!-- rule-that-returns-nothing -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, badRules)
		const warnMessage = result.messages.find((message) => message.fatal === false)
		expect(warnMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(warnMessage!.message)).toMatchInlineSnapshot(
			`"<!-- rule-that-returns-nothing --> returned an empty string."`,
		)
	})

	it('should report errors when rules throw errors', async () => {
		const badRules: Rules = {
			...rules,
			'rule-that-throws'() {
				throw new Error('This rule throws')
			},
		}
		const markdown = `<!-- rule-that-throws -->\n<!-- first-expansion -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, badRules)
		const errorMessage = result.messages.find((message) => message.fatal === true)
		expect(errorMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(errorMessage!.message)).toMatchInlineSnapshot(
			`"Caught error expanding <!-- rule-that-throws -->, Error message: "Failed to expand content: This rule throws""`,
		)
	})

	it('should warn about missing rules', async () => {
		const markdown = `<!-- mystery-comment -->\n<!-- first-expansion -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, rules)
		const errorMessage = result.messages.find((message) => message.fatal === false) // "warn" level

		expect(errorMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(errorMessage!.message)).toMatchInlineSnapshot(
			`"Missing rule for: <!-- mystery-comment -->"`,
		)
	})
})
