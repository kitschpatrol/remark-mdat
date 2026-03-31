/* eslint-disable ts/no-unsafe-function-type */
/* eslint-disable ts/no-unsafe-call */
/* eslint-disable ts/no-unsafe-type-assertion */
import { describe, expect, it } from 'vitest'
import type { NormalizedRules, Rules } from '../src/lib/mdat/rules'
import { getSoleRule, getSoleRuleKey, normalizeRules, validateRules } from '../src/lib/mdat/rules'

describe('normalizeRules', () => {
	it('should normalize a string rule', async () => {
		const rules: Rules = { greeting: 'hello' }
		const normalized = normalizeRules(rules)

		expect(normalized.greeting.order).toBe(0)
		expect(typeof normalized.greeting.content).toBe('function')
		// Content function should return the string
		expect(await (normalized.greeting.content as Function)({}, {})).toBe('hello')
	})

	it('should normalize a function rule', async () => {
		const rules: Rules = { time: () => 'now' }
		const normalized = normalizeRules(rules)

		expect(typeof normalized.time.content).toBe('function')
		expect(await (normalized.time.content as Function)({}, {})).toBe('now')
	})

	it('should normalize an async function rule', async () => {
		// eslint-disable-next-line ts/require-await
		const rules: Rules = { time: async () => 'later' }
		const normalized = normalizeRules(rules)

		expect(await (normalized.time.content as Function)({}, {})).toBe('later')
	})

	it('should normalize a string-content object rule with metadata', async () => {
		const rules: Rules = {
			title: {
				content: 'My Title',
				order: 5,
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.title.order).toBe(5)
		expect(await (normalized.title.content as Function)({}, {})).toBe('My Title')
	})

	it('should normalize a function-content object rule with metadata', async () => {
		const rules: Rules = {
			title: {
				content: () => 'dynamic',
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.title.order).toBe(0)
		expect(await (normalized.title.content as Function)({}, {})).toBe('dynamic')
	})

	it('should normalize a top-level compound rule (array)', () => {
		const rules: Rules = { header: ['one', 'two'] }
		const normalized = normalizeRules(rules)

		expect(normalized.header.order).toBe(0)
		expect(Array.isArray(normalized.header.content)).toBe(true)
		expect((normalized.header.content as unknown[]).length).toBe(2)
	})

	it('should normalize an object-form compound rule with metadata', () => {
		const rules: Rules = {
			header: {
				content: ['one', 'two'],
				order: 3,
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.header.order).toBe(3)
		expect(Array.isArray(normalized.header.content)).toBe(true)
	})

	it('should default optional metadata fields', () => {
		const rules: Rules = {
			minimal: {
				content: 'just content',
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.minimal.order).toBe(0)
	})
})

describe('validateRules', () => {
	it('should accept valid rules', () => {
		const rules: Rules = {
			a: 'string',
			b: () => 'function',
			c: { content: 'object' },
			d: ['compound', 'rule'],
		}

		expect(() => {
			validateRules(rules)
		}).not.toThrow()
	})

	it('should reject invalid rules', () => {
		const rules = { bad: 123 } as unknown as Rules
		expect(() => {
			validateRules(rules)
		}).toThrow('Error validating rules')
	})

	it('should reject keywords starting with reserved characters', () => {
		expect(() => {
			validateRules({ '/keyword': 'content' })
		}).toThrow('Error validating rules')
		expect(() => {
			validateRules({ '#keyword': 'content' })
		}).toThrow('Error validating rules')
		expect(() => {
			validateRules({ '*keyword': 'content' })
		}).toThrow('Error validating rules')
		expect(() => {
			validateRules({ '//comment': 'content' })
		}).toThrow('Error validating rules')
	})
})

describe('getSoleRule', () => {
	it('should return the sole rule value', () => {
		const rules: Rules = { only: 'the one' }
		expect(getSoleRule(rules)).toBe('the one')
	})

	it('should throw for empty rules', () => {
		const rules: Rules = {}
		expect(() => getSoleRule(rules)).toThrow()
	})

	it('should throw for multiple rules', () => {
		const rules: Rules = { a: 'one', b: 'two' }
		expect(() => getSoleRule(rules)).toThrow()
	})

	it('should work with normalized rules', async () => {
		const rules: Rules = { only: 'the one' }
		const normalized: NormalizedRules = normalizeRules(rules)
		const sole = getSoleRule(normalized)

		expect(await (sole.content as Function)({}, {})).toBe('the one')
	})
})

describe('getSoleRuleKey', () => {
	it('should return the sole rule key', () => {
		const rules: Rules = { myKey: 'value' }
		expect(getSoleRuleKey(rules)).toBe('myKey')
	})

	it('should throw for empty rules', () => {
		const rules: Rules = {}
		expect(() => getSoleRuleKey(rules)).toThrow('Expected exactly one rule, found 0')
	})

	it('should throw for multiple rules', () => {
		const rules: Rules = { a: 'one', b: 'two' }
		expect(() => getSoleRuleKey(rules)).toThrow('Expected exactly one rule, found 2')
	})
})
