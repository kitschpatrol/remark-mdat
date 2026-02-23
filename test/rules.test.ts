import { describe, expect, it } from 'vitest'
import type { NormalizedRules, Rules } from '../src/lib/mdat/rules'
import {
	getSoleRule,
	getSoleRuleKey,
	normalizeRules,
	validateRules,
} from '../src/lib/mdat/rules'

describe('normalizeRules', () => {
	it('should normalize a string rule', async () => {
		const rules: Rules = { greeting: 'hello' }
		const normalized = normalizeRules(rules)

		expect(normalized.greeting.applicationOrder).toBe(0)
		expect(normalized.greeting.order).toBeUndefined()
		expect(normalized.greeting.required).toBe(false)
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
		const rules: Rules = { time: async () => 'later' }
		const normalized = normalizeRules(rules)

		expect(await (normalized.time.content as Function)({}, {})).toBe('later')
	})

	it('should normalize a string-content object rule with metadata', async () => {
		const rules: Rules = {
			title: {
				applicationOrder: 5,
				content: 'My Title',
				order: 2,
				required: true,
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.title.applicationOrder).toBe(5)
		expect(normalized.title.order).toBe(2)
		expect(normalized.title.required).toBe(true)
		expect(await (normalized.title.content as Function)({}, {})).toBe('My Title')
	})

	it('should normalize a function-content object rule with metadata', async () => {
		const rules: Rules = {
			title: {
				content: () => 'dynamic',
				required: true,
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.title.required).toBe(true)
		expect(normalized.title.applicationOrder).toBe(0)
		expect(await (normalized.title.content as Function)({}, {})).toBe('dynamic')
	})

	it('should normalize a top-level compound rule (array)', () => {
		const rules: Rules = { header: ['one', 'two'] }
		const normalized = normalizeRules(rules)

		expect(normalized.header.applicationOrder).toBe(0)
		expect(normalized.header.required).toBe(false)
		expect(Array.isArray(normalized.header.content)).toBe(true)
		expect((normalized.header.content as Array<unknown>).length).toBe(2)
	})

	it('should normalize an object-form compound rule with metadata', () => {
		const rules: Rules = {
			header: {
				applicationOrder: 3,
				content: ['one', 'two'],
				required: true,
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.header.applicationOrder).toBe(3)
		expect(normalized.header.required).toBe(true)
		expect(Array.isArray(normalized.header.content)).toBe(true)
	})

	it('should default optional metadata fields', () => {
		const rules: Rules = {
			minimal: {
				content: 'just content',
			},
		}
		const normalized = normalizeRules(rules)

		expect(normalized.minimal.applicationOrder).toBe(0)
		expect(normalized.minimal.order).toBeUndefined()
		expect(normalized.minimal.required).toBe(false)
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

		expect(() => validateRules(rules)).not.toThrow()
	})

	it('should reject invalid rules', () => {
		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const rules = { bad: 123 } as unknown as Rules
		expect(() => validateRules(rules)).toThrow('Error validating rules')
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

		expect(sole.required).toBe(false)
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
