/* eslint-disable jsdoc/require-jsdoc */
import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import fs from 'node:fs/promises'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import type { RuleContext, Rules } from '../src'
import remarkMdat, { mdatCollapse, mdatSplit } from '../src'
import testRules from './assets/test-rules'
import testRulesInvalid from './assets/test-rules-invalid'

async function expandStringToString(markdown: string, rules: Rules): Promise<string> {
	const result = await remark().use(remarkGfm).use(remarkMdat, { rules }).process(markdown)
	return result.toString()
}

async function expandStringToVfile(markdown: string, rules: Rules): Promise<VFile> {
	return remark().use(remarkGfm).use(remarkMdat, { rules }).process(markdown)
}

function stripAnsiEscapeCodes(text: string): string {
	// eslint-disable-next-line no-control-regex
	return text.replaceAll(/\u001B\[[\d;]*m/g, '')
}

// Export for linter
export async function collapseString(markdown: string): Promise<string> {
	const result = await remark()
		.use(remarkGfm)
		.use(
			() =>
				// eslint-disable-next-line unicorn/consistent-function-scoping
				function (tree: Root, file: VFile) {
					mdatSplit(tree, file)
					mdatCollapse(tree, file)
				},
		)
		.process(markdown)
	return result.toString()
}

async function expandFileToString(file: string, rules: Rules): Promise<string> {
	const buffer = await fs.readFile(file)
	const result = await remark().use(remarkGfm).use(remarkMdat, { rules }).process(buffer)
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

	it('should skip a failing sub-rule and expand the rest', async () => {
		const markdown = `<!-- compound -->\n`
		const rules: Rules = {
			compound: [
				'first',
				() => {
					throw new Error('Sub-rule broke')
				},
				'third',
			],
		}
		const result = await expandStringToVfile(markdown, rules)
		const output = result.toString()
		expect(output).toContain('first')
		expect(output).toContain('third')
		expect(output).not.toContain('Sub-rule broke')
		const warning = result.messages.find((m) => m.fatal === false)
		expect(warning).toBeDefined()
		expect(stripAnsiEscapeCodes(warning!.message)).toContain('Sub-rule 1 failed')
	})

	it('should error when all sub-rules in a compound rule fail', async () => {
		const markdown = `<!-- compound -->\n`
		const rules: Rules = {
			compound: [
				() => {
					throw new Error('fail 1')
				},
				() => {
					throw new Error('fail 2')
				},
			],
		}
		const result = await expandStringToVfile(markdown, rules)
		const error = result.messages.find((m) => m.fatal === true)
		expect(error).toBeDefined()
		expect(stripAnsiEscapeCodes(error!.message)).toContain('All sub-rules failed')
	})

	it('should pass option arrays to compound rules', async () => {
		const markdown = `<!-- compound([{option: 'yes'}, {option: 'it'}, {option: 'can'}]) -->\n`
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
			"<!-- compound([{option: 'yes'}, {option: 'it'}, {option: 'can'}]) -->

			My option is: yes

			My option is: it

			My option is: can

			<!-- /compound -->
			"
		`)
	})
})

describe('idempotency', () => {
	it('should be idempotent with option arguments', async () => {
		const markdown = `<!-- greet({name: "Alice"}) -->\n`
		const rules: Rules = {
			// eslint-disable-next-line ts/no-unsafe-type-assertion
			greet: (options) => `Hello, ${(options as { name: string }).name}!`,
		}
		const firstPass = await expandStringToString(markdown, rules)
		const secondPass = await expandStringToString(firstPass, rules)
		expect(firstPass).toEqual(secondPass)
	})

	it('should be idempotent with compound rules', async () => {
		const markdown = `<!-- compound -->\n`
		const rules: Rules = { compound: ['Line 1', 'Line 2'] }
		const firstPass = await expandStringToString(markdown, rules)
		const secondPass = await expandStringToString(firstPass, rules)
		expect(firstPass).toEqual(secondPass)
	})

	it('should be idempotent with mixed rule types', async () => {
		const markdown = `<!-- str -->\n<!-- func -->\n<!-- comp -->\n`
		const rules: Rules = {
			comp: ['a', 'b'],
			func: () => 'dynamic',
			str: 'static',
		}
		const firstPass = await expandStringToString(markdown, rules)
		const secondPass = await expandStringToString(firstPass, rules)
		expect(firstPass).toEqual(secondPass)
	})
})

describe('collapsed round-trip', () => {
	it('should collapsed expanded comments back to placeholders', async () => {
		const original = `<!-- keyword -->\n`
		const expanded = await expandStringToString(original, { keyword: 'expanded content' })
		const collapsed = await collapseString(expanded)
		expect(collapsed.trim()).toBe(original.trim())
	})

	it('should preserve surrounding content through expand and collapsed', async () => {
		const original = `# Header\n\nSome content\n\n<!-- keyword -->\n\nMore content\n`
		const expanded = await expandStringToString(original, { keyword: 'expanded' })
		const collapsed = await collapseString(expanded)
		expect(collapsed).toContain('# Header')
		expect(collapsed).toContain('Some content')
		expect(collapsed).toContain('More content')
		expect(collapsed).toContain('<!-- keyword -->')
		expect(collapsed).not.toContain('<!-- /keyword -->')
	})
})

describe('same keyword with different options', () => {
	it('should expand multiple instances with distinct options', async () => {
		const markdown = `<!-- greet({name: "Alice"}) -->\n\n<!-- greet({name: "Bob"}) -->\n`
		const rules: Rules = {
			// eslint-disable-next-line ts/no-unsafe-type-assertion
			greet: (options) => `Hello, ${(options as { name: string }).name}!`,
		}
		const result = await expandStringToString(markdown, rules)
		expect(result).toContain('Hello, Alice!')
		expect(result).toContain('Hello, Bob!')
	})
})

describe('argument edge cases', () => {
	it('should parse string arguments containing parentheses', async () => {
		const markdown = `<!-- keyword({pattern: "func(arg)"}) -->\n`
		const rules: Rules = {
			// eslint-disable-next-line ts/no-unsafe-type-assertion
			keyword: (options) => `Pattern: ${(options as { pattern: string }).pattern}`,
		}
		const result = await expandStringToString(markdown, rules)
		expect(result).toContain('Pattern: func(arg)')
	})

	it('should handle null argument', async () => {
		const markdown = `<!-- keyword(null) -->\n`
		const rules: Rules = {
			keyword: (options) => `Got: ${options === null ? 'null' : 'not null'}`,
		}
		const result = await expandStringToString(markdown, rules)
		expect(result).toContain('Got: null')
	})
})

describe('parse error propagation', () => {
	it('should propagate parse errors from invalid JSON5 in comment options', async () => {
		const markdown = `<!-- keyword({bad: ) -->\n`
		await expect(expandStringToString(markdown, { keyword: 'content' })).rejects.toThrow(
			'Failed to parse comment options',
		)
	})
})

describe('async error handling', () => {
	it('should report errors when async rules reject', async () => {
		const rules: Rules = {
			// eslint-disable-next-line ts/require-await
			async rejecter() {
				throw new Error('Async failure')
			},
		}
		const markdown = `<!-- rejecter -->\n`
		const result = await expandStringToVfile(markdown, rules)
		const errorMessage = result.messages.find((message) => message.fatal === true)
		expect(errorMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(errorMessage!.message)).toContain('Async failure')
	})
})

describe('VFile message reporting', () => {
	const validRules: Rules = {
		'first-expansion': 'This is first',
		'optional-expansion': 'This is optional',
		'second-expansion': 'This is second',
	}

	it('should not report errors when valid', async () => {
		const markdown = `<!-- first-expansion -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, validRules)
		const foundError = result.messages.some((message) => message.fatal === true)
		expect(foundError).toBeFalsy()
	})

	it('should report errors when rules return nothing', async () => {
		const badRules: Rules = {
			...validRules,
			'rule-that-returns-nothing': '',
		}
		const markdown = `<!-- first-expansion -->\n<!-- rule-that-returns-nothing -->\n<!-- optional-expansion -->\n<!-- second-expansion -->`
		const result = await expandStringToVfile(markdown, badRules)
		const errorMessage = result.messages.find((message) => message.fatal === true)
		expect(errorMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(errorMessage!.message)).toMatchInlineSnapshot(
			`"Got empty content when expanding <!-- rule-that-returns-nothing -->"`,
		)
	})

	it('should report errors when rules throw', async () => {
		const badRules: Rules = {
			...validRules,
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
		const result = await expandStringToVfile(markdown, validRules)
		const warnMessage = result.messages.find((message) => message.fatal === false)
		expect(warnMessage).toBeDefined()
		expect(stripAnsiEscapeCodes(warnMessage!.message)).toMatchInlineSnapshot(
			`"Missing rule for: <!-- mystery-comment -->"`,
		)
	})
})

describe('collapse error paths', () => {
	it('should handle closing marker without opening marker', async () => {
		const markdown = `<!-- /orphan -->\n`
		const result = await remark()
			.use(remarkGfm)
			.use(
				() =>
					// eslint-disable-next-line unicorn/consistent-function-scoping
					function (tree: Root, file: VFile) {
						mdatSplit(tree, file)
						mdatCollapse(tree, file)
					},
			)
			.process(markdown)
		const error = result.messages.find((m) => m.fatal === true)
		expect(error).toBeDefined()
		expect(error!.reason).toContain('closing marker without opening marker')
	})

	it('should handle keyword mismatch between open and close markers', async () => {
		const markdown = `<!-- alpha -->\n\ncontent\n\n<!-- /beta -->\n`
		const result = await remark()
			.use(remarkGfm)
			.use(
				() =>
					// eslint-disable-next-line unicorn/consistent-function-scoping
					function (tree: Root, file: VFile) {
						mdatSplit(tree, file)
						mdatCollapse(tree, file)
					},
			)
			.process(markdown)
		const error = result.messages.find((m) => m.fatal === true)
		expect(error).toBeDefined()
		expect(error!.reason).toContain("doesn't share a keyword")
	})

	it('should handle open and close markers in different parents', async () => {
		// Open inside a blockquote, close outside
		const markdown = `> <!-- nested -->\n\n<!-- /nested -->\n`
		const result = await remark()
			.use(remarkGfm)
			.use(
				() =>
					// eslint-disable-next-line unicorn/consistent-function-scoping
					function (tree: Root, file: VFile) {
						mdatSplit(tree, file)
						mdatCollapse(tree, file)
					},
			)
			.process(markdown)
		const error = result.messages.find((m) => m.fatal === true)
		expect(error).toBeDefined()
		expect(error!.reason).toContain("doesn't share a parent")
	})
})

describe('rule context', () => {
	const contextRules: Rules = {
		'file-path'(_options: unknown, context: RuleContext) {
			return `Path: ${context.filePath ?? 'unknown'}`
		},
		'frontmatter-field'(options: unknown, context: RuleContext) {
			if (typeof options !== 'object' || options === null || !('field' in options)) {
				return 'not found'
			}

			const field = String(options.field)
			const value = context.frontmatter?.[field]
			return `${field}: ${typeof value === 'string' ? value : 'not found'}`
		},
		'frontmatter-summary'(_options: unknown, context: RuleContext) {
			const title = context.frontmatter?.title
			const path = context.filePath ?? 'unknown'
			return `File "${path}" titled "${typeof title === 'string' ? title : 'untitled'}"`
		},
		'frontmatter-tags'(_options: unknown, context: RuleContext) {
			const tags = context.frontmatter?.tags
			if (!Array.isArray(tags)) return 'No tags'
			return tags.map((tag: unknown) => `- ${String(tag)}`).join('\n')
		},
		'frontmatter-title'(_options: unknown, context: RuleContext) {
			const title = context.frontmatter?.title
			return `Title: ${typeof title === 'string' ? title : 'none'}`
		},
	}

	it('should expand fixture file with frontmatter context', async () => {
		const result = await expandFileToString(
			'./test/assets/test-document-frontmatter.md',
			contextRules,
		)
		expect(result).toMatchSnapshot()
	})

	it('should pass parsed frontmatter to rule content functions', async () => {
		const markdown = `---\ntitle: Hello World\ntags:\n  - one\n  - two\n---\n\n<!-- frontmatter-title -->\n`
		const result = await expandStringToString(markdown, contextRules)
		expect(result).toContain('Title: Hello World')
	})

	it('should pass undefined frontmatter when document has none', async () => {
		const markdown = `<!-- frontmatter-title -->\n`
		const result = await expandStringToString(markdown, contextRules)
		expect(result).toContain('Title: none')
	})

	it('should pass the mdast tree in context', async () => {
		const markdown = `# Heading\n\n<!-- check -->\n`
		const rules: Rules = {
			check(_options: unknown, context: RuleContext) {
				const hasHeading = context.tree.children.some((node) => node.type === 'heading')
				return `Has heading: ${String(hasHeading)}`
			},
		}
		const result = await expandStringToString(markdown, rules)
		expect(result).toContain('Has heading: true')
	})

	it('should pass array frontmatter values', async () => {
		const markdown = `---\ntags:\n  - alpha\n  - beta\n---\n\n<!-- frontmatter-tags -->\n`
		const result = await expandStringToString(markdown, contextRules)
		expect(result).toContain('* alpha')
		expect(result).toContain('* beta')
	})

	it('should pass frontmatter field via options', async () => {
		const markdown = `---\ndescription: A great doc\n---\n\n<!-- frontmatter-field({field: "description"}) -->\n`
		const result = await expandStringToString(markdown, contextRules)
		expect(result).toContain('description: A great doc')
	})
})
