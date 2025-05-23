/* eslint-disable jsdoc/require-jsdoc */
import type { Root } from 'mdast'
import type { JsonValue, Merge, MergeDeep, SetOptional, Simplify } from 'type-fest'
import { z } from 'zod'

// Note that more advanced rule loading is implemented in `mdat`

// Type-fest's internal SimplifyDeep implementation is not exported
// this isn't quite the same, but works for our purposes
export type SimplifyDeep<T> = Simplify<MergeDeep<T, T>>

// Basic interface for comment expanders

/**
 * Strict normalized rules used internally.
 * Rules normalized to a form with async content functions and other default metadata
 * Simplifies processing elsewhere, while retaining flexibility for rule authors
 */
export type NormalizedRule = {
	/**
	 * The order in which the rule should be applied during processing
	 * Helpful if a rule depends on the presence of content generated by another rule
	 * Defaults to 0.
	 */
	applicationOrder: number
	/**
	 * The function that generates the expanded Markdown string.
	 * For 'compound' rules, this can be an array of rules (without keywords).
	 */
	content: ((options: JsonValue, tree: Root) => Promise<string>) | NormalizedRule[]
	/**
	 * The expected order of the keyword in the document relative to other expander comments.
	 * Used for validation purposes.
	 * Leave undefined to order skip validation.
	 * Defaults to undefined, which means order is not enforced.
	 */
	order: number | undefined
	/**
	 * Whether the presence of the keyword comment in the document is required.
	 * Used for validation purposes.
	 * Defaults to false.
	 */
	required: boolean
}

// More flexible rules used in the public interface
export type Rule =
	/**
	 * Function that returns the Markdown string to expand at the comment site.
	 */
	| ((options: JsonValue, tree: Root) => Promise<string> | string)
	/**
	 * Compound rules may be defined an array of rules, without keywords.
	 * Can be defined at the top level, if no validation metadata is required, or as the 'content' value
	 * of a rule object with validation metadata.
	 */
	| Rule[]
	/**
	 * The Markdown string to expand at the comment site.
	 */
	| SetOptional<
			Merge<
				NormalizedRule,
				{
					/**
					 * Gets content to expand into the comment.
					 * Can be a simple string for direct replacement, a function that returns a string, or an async function that returns a string.
					 *
					 * If a function is provided, it will be passed the following arguments:
					 * @param options
					 * JSON value of options parsed immediately after the comment keyword in the comment, e.g.:
					 * `<!-- keyword({something: true}) -->` or
					 * `<!-- keyword {something: true}-->`
					 * Sets options to {something: true}
					 * @param tree
					 * Markdown (mdast) abstract syntax tree containing the entire parsed document. Useful for expanders that need the entire document context, such as when generating a table of contents. Do not mutate the AST, instead return a new string.
					 * @returns A string with the generated content. The string will be parsed as Markdown and inserted into the document at the comment's location.
					 */
					content: ((options: JsonValue, tree: Root) => Promise<string> | string) | Rule[] | string
				}
			>,
			'applicationOrder' | 'order' | 'required'
	  >
	| string

/**
 * Rules are record objects whose keys match strings inside a Markdown comment, and values explain what should be expanded at the comment site.
 *
 * The record value may be a string, or an object containing additional metadata, possibly with a function to invoke to generate content.
 * @example
 * Most basic rule:
 * ```ts
 * { basic: 'content' }
 * ```
 *
 * Rule with dynamic content:
 * ```ts
 * { basic: () => `${new Date().toISOString()}` }
 * ```
 *
 * Rule with metadata:
 * ```ts
 * { basic-meta: { required: true, content: 'content'} }
 * ```
 *
 * Rule with dynamic content and metadata:
 * { basic-date: { required: true, content: () => `${new Date().toISOString()}` } }
 */
export type Rules = SimplifyDeep<Record<string, Rule>>

export type NormalizedRules = SimplifyDeep<Record<string, NormalizedRule>>

// Helpers
export function normalizeRules(rules: Rules): NormalizedRules {
	const normalizedRules: NormalizedRules = {}

	for (const [keyword, rule] of Object.entries(rules)) {
		if (typeof rule === 'string') {
			// Rule is just a simple string replacement, no metadata provided
			normalizedRules[keyword] = {
				applicationOrder: 0,
				// eslint-disable-next-line ts/require-await
				content: async () => rule,
				order: undefined,
				required: false,
			}
		} else if (typeof rule === 'function') {
			// Rule is a function that returns a string
			// Wrapped so it can be sync or async
			normalizedRules[keyword] = {
				applicationOrder: 0,
				content: async (options: JsonValue, tree: Root) => rule(options, tree),
				order: undefined,
				required: false,
			}
		} else if (Array.isArray(rule)) {
			// Top-level compound rule, gets wrapped in a normal rule
			normalizedRules[keyword] = {
				applicationOrder: 0,
				content: Object.values(normalizeRules(Object.fromEntries(rule.entries()))),
				order: undefined,
				required: false,
			}
		} else if (typeof rule.content === 'string') {
			// String replacement with metadata
			// Merge any existing metadata, but turn content into a function
			const ruleContent = rule.content // Needed for type narrowing
			normalizedRules[keyword] = {
				applicationOrder: rule.applicationOrder ?? 0,
				// eslint-disable-next-line ts/require-await
				content: async () => ruleContent,
				order: rule.order ?? undefined,
				required: rule.required ?? false,
			}
		} else if (Array.isArray(rule.content)) {
			// Compound rule with metadata
			// Normalize the array of rules
			normalizedRules[keyword] = {
				applicationOrder: rule.applicationOrder ?? 0,
				content: Object.values(normalizeRules(Object.fromEntries(rule.content.entries()))),
				order: rule.order ?? undefined,
				required: rule.required ?? false,
			}
		} else {
			// Rule with metadata
			// Rule content returns a function, wrapped so it can be sync or async
			const ruleContent = rule.content // Needed for type narrowing
			normalizedRules[keyword] = {
				applicationOrder: rule.applicationOrder ?? 0,
				content: async (options: JsonValue, tree: Root) => ruleContent(options, tree),
				order: rule.order ?? undefined,
				required: rule.required ?? false,
			}
		}
	}

	validateNormalizedRules(normalizedRules)
	return normalizedRules
}

export function validateRules(rules: Rules) {
	// Check, throws on errors
	try {
		rulesSchema.parse(rules)
	} catch (error) {
		if (error instanceof Error) {
			throw new TypeError(`Error validating rules: ${error.message}`)
		}
	}
}

function validateNormalizedRules(rules: NormalizedRules) {
	// Check, throws on errors
	try {
		normalizedRulesSchema.parse(rules)
	} catch (error) {
		if (error instanceof Error) {
			throw new TypeError(`Error validating rules: ${error.message}`)
		}
	}
}

// ----------------------------------------------------------

// Some duplication here, but less painful than inferring the TS types
// _from_ the Zod schemas because of the JsonValue and Root types.

// TODO maybe narrow these, or use unknown...
const jsonValueSchema = z.any()
const rootSchema = z.any()

// Declaration of normalizedRuleSchema for recursion within ruleSchema
const normalizedRuleSchema: z.ZodSchema = z.lazy(() =>
	z.object({
		applicationOrder: z.number(),
		content: z.union([
			z
				.function()
				.args(jsonValueSchema.optional(), rootSchema.optional())
				.returns(z.promise(z.string())),
			z.array(normalizedRuleSchema),
		]),
		order: z.number().optional(),
		required: z.boolean().default(false),
	}),
)

// Declaration of ruleSchema to include all possible types for Rule

const ruleContentFunctionSchema = z
	.function()
	.args(jsonValueSchema.optional(), rootSchema.optional())
	.returns(z.union([z.string(), z.promise(z.string())]))

const ruleSchema: z.ZodSchema = z.lazy(() =>
	z.union([
		// Extra top level options
		ruleContentFunctionSchema, // Content function
		z.array(ruleSchema), // Array of rules (compound rule)
		z.string(), // Just a keyword
		z.object({
			applicationOrder: z.number().optional(),
			content: z.union([
				ruleContentFunctionSchema, // Content function
				z.array(ruleSchema), // Array of rules (compound rule)
				z.string(), // Just a keyword
			]),
			order: z.number().optional(),
			required: z.boolean().optional(),
		}),
	]),
)
// Z.array(z.lazy(() => ruleSchema)), // Correctly handle recursive arrays of Rule

export const rulesSchema = z.record(ruleSchema).describe('MDAT Rules')
const normalizedRulesSchema = z.record(normalizedRuleSchema).describe('MDAT Rules')

// ----------------------------------------------------------

/**
 * Compound rule helpers, used in both "expand" and "check" utilities
 */
export async function getRuleContent(
	rule: NormalizedRule,
	options: JsonValue,
	tree: Root,
	check = false,
): Promise<string> {
	if (Array.isArray(rule.content)) {
		const subruleContent = []
		for (const [index, subrule] of rule.content.entries()) {
			const subruleOptions = Array.isArray(options) ? options.at(index) : undefined

			try {
				subruleContent.push(await getRuleContent(subrule, subruleOptions ?? {}, tree))
			} catch (error) {
				if (check) {
					throw error
				}
			}
		}

		return subruleContent.join('\n\n')
	}

	try {
		return await rule.content(options, tree)
	} catch (error) {
		if (check) {
			throw error
		}
	}

	throw new Error('Failed to expand content')
}

/**
 * Returns the rule value from a single-rule record.
 * Useful when aliasing rules or invoking them programmatically.
 *
 * Throws if there are no entries or more than one entry.
 */
export function getSoleRule<T extends NormalizedRules | Rules>(rules: T): T[keyof T] {
	return getSoleRecord<T[keyof T]>(rules as Record<string, T[keyof T]>)
}

/**
 * Returns the rule key from a single-rule record.
 * Useful for comment placeholder validation.
 *
 * Throws if there are no entries or more than one entry.
 */
export function getSoleRuleKey<T extends NormalizedRules | Rules>(rules: T): keyof T {
	const keys = Object.keys(rules)
	if (keys.length !== 1) {
		throw new Error(`Expected exactly one rule, found ${keys.length}`)
	}

	return keys[0]
}

/**
 * Get the sole entry in a record.
 *
 * Useful for working with Rules records
 * that are only supposed to contain a single rule.
 * @param record The record to get the sole entry from
 * @returns The value of the sole entry in the record
 * @throws If there are no entries or more than one entry
 */
function getSoleRecord<V>(record: Record<string, V>): V {
	const recordValues = Object.values(record)
	if (recordValues.length === 0) {
		throw new Error('Found no entries in a "sole record" record. This should never happen')
	}

	if (recordValues.length > 1) {
		throw new Error('Found multiple entries in "sole record" record. This should never happen')
	}

	return recordValues[0]
}
