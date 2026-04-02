/* eslint-disable unicorn/prefer-single-call */

import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { bench, describe } from 'vitest'
import type { Rules } from '../../src'
import remarkMdat, { mdatClean, mdatSplit } from '../../src'
import { splitHtmlIntoMdastNodes } from '../../src/lib/mdast-utils/mdast-util-mdat-split'
import { parseComment } from '../../src/lib/mdat/parse'
import { normalizeRules } from '../../src/lib/mdat/rules'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRules(n: number): Rules {
	const rules: Rules = {}
	for (let i = 0; i < n; i++) {
		rules[`rule-${String(i)}`] = `Content for rule ${String(i)}.\n\nA second paragraph.`
	}

	return rules
}

function makeDynamicRules(n: number): Rules {
	const rules: Rules = {}
	for (let i = 0; i < n; i++) {
		rules[`rule-${String(i)}`] = {
			content(options) {
				const label =
					typeof options === 'object' && options !== null && 'label' in options
						? String((options as Record<string, unknown>).label)
						: String(i)
				return `Dynamic content ${label}.`
			},
		}
	}

	return rules
}

function makeDocument(n: number): string {
	const lines = ['# Benchmark Document\n']
	for (let i = 0; i < n; i++) {
		lines.push(`## Section ${String(i)}\n`)
		lines.push(`<!-- rule-${String(i)} -->\n`)
	}

	return lines.join('\n')
}

function makeDocumentWithOptions(n: number): string {
	const lines = ['# Benchmark Document with Options\n']
	for (let i = 0; i < n; i++) {
		lines.push(`## Section ${String(i)}\n`)
		lines.push(`<!-- rule-${String(i)}({label: "item-${String(i)}"}) -->\n`)
	}

	return lines.join('\n')
}

function makeExpandedDocument(n: number): string {
	const lines = ['# Benchmark Expanded Document\n']
	for (let i = 0; i < n; i++) {
		lines.push(`## Section ${String(i)}\n`)
		lines.push(`<!-- rule-${String(i)} -->\n`)
		lines.push(`Content for rule ${String(i)}.\n`, `A second paragraph.\n`)
		lines.push(`<!-- /rule-${String(i)} -->\n`)
	}

	return lines.join('\n')
}

function makeDocumentWithFrontmatter(n: number): string {
	const fm = [
		'---',
		'title: Benchmark',
		'author: Test',
		'tags:',
		'  - perf',
		'  - bench',
		'---',
		'',
	]
	return fm.join('\n') + makeDocument(n)
}

function makeAdjacentCommentsDocument(n: number): string {
	const comments = Array.from({ length: n }, (_, i) => `<!-- rule-${String(i)} -->`).join('')
	return `# Adjacent\n\n${comments}\n`
}

async function processString(markdown: string, rules: Rules): Promise<string> {
	const result = await remark().use(remarkGfm).use(remarkMdat, { rules }).process(markdown)
	return result.toString()
}

async function cleanString(markdown: string): Promise<string> {
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

// ---------------------------------------------------------------------------
// Fixtures (created once, reused across benchmarks)
// ---------------------------------------------------------------------------

const smallRules = makeRules(3)
const mediumRules = makeRules(15)
const largeRules = makeRules(50)
const dynamicRules = makeDynamicRules(15)

const smallDoc = makeDocument(3)
const mediumDoc = makeDocument(15)
const largeDoc = makeDocument(50)
const optionsDoc = makeDocumentWithOptions(15)
const frontmatterDoc = makeDocumentWithFrontmatter(15)
const adjacentDoc = makeAdjacentCommentsDocument(10)

const smallExpandedDoc = makeExpandedDocument(3)
const largeExpandedDoc = makeExpandedDocument(50)

// Pre-expand for idempotency benchmark
let mediumExpandedDoc: string
try {
	mediumExpandedDoc = await processString(mediumDoc, mediumRules)
} catch {
	mediumExpandedDoc = makeExpandedDocument(15)
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe('parseComment', () => {
	bench('simple keyword', () => {
		parseComment('<!-- basic -->')
	})

	bench('keyword with JSON5 options', () => {
		parseComment('<!-- keyword({prefix: "hello", suffix: "world", nested: {a: 1}}) -->')
	})

	bench('close tag', () => {
		parseComment('/basic')
	})

	bench('non-comment passthrough', () => {
		parseComment('// this is not an HTML comment')
	})

	bench('code-style comment in HTML', () => {
		parseComment('<!-- // code comment -->')
	})

	bench('triple-dash comment', () => {
		parseComment('<!--- basic-options({prefix: "x", suffix: "y"}) -->')
	})
})

describe('splitHtmlIntoMdastNodes', () => {
	bench('single comment (no split needed)', () => {
		splitHtmlIntoMdastNodes({ type: 'html', value: '<!-- basic -->' })
	})

	bench('three adjacent comments', () => {
		splitHtmlIntoMdastNodes({
			type: 'html',
			value: '<!-- a --><!-- b --><!-- c -->',
		})
	})

	bench('comment with interleaved text', () => {
		splitHtmlIntoMdastNodes({
			type: 'html',
			value: '<!-- a --><b>text</b><!-- b -->',
		})
	})

	bench('ten adjacent comments', () => {
		splitHtmlIntoMdastNodes({
			type: 'html',
			value: Array.from({ length: 10 }, (_, i) => `<!-- rule-${String(i)} -->`).join(''),
		})
	})
})

describe('normalizeRules', () => {
	bench('small ruleset (3 rules)', () => {
		normalizeRules(smallRules)
	})

	bench('medium ruleset (15 rules)', () => {
		normalizeRules(mediumRules)
	})

	bench('large ruleset (50 rules)', () => {
		normalizeRules(largeRules)
	})

	bench('dynamic function rules (15)', () => {
		normalizeRules(dynamicRules)
	})
})

describe('clean (split + collapse expanded content)', () => {
	bench('small expanded document (3 pairs)', async () => {
		await cleanString(smallExpandedDoc)
	})

	bench('large expanded document (50 pairs)', async () => {
		await cleanString(largeExpandedDoc)
	})
})

describe('full pipeline', () => {
	bench('small document (3 comments)', async () => {
		await processString(smallDoc, smallRules)
	})

	bench('medium document (15 comments)', async () => {
		await processString(mediumDoc, mediumRules)
	})

	bench(
		'large document (50 comments)',
		async () => {
			await processString(largeDoc, largeRules)
		},
		{ iterations: 20, warmupIterations: 2 },
	)

	bench('medium document with dynamic rules', async () => {
		await processString(mediumDoc, dynamicRules)
	})

	bench('medium document with JSON5 options', async () => {
		await processString(optionsDoc, dynamicRules)
	})

	bench('medium document with frontmatter', async () => {
		await processString(frontmatterDoc, mediumRules)
	})

	bench('idempotent re-expansion (already expanded)', async () => {
		await processString(mediumExpandedDoc, mediumRules)
	})

	bench('adjacent comments (10 in one node)', async () => {
		await processString(adjacentDoc, makeRules(10))
	})
})
