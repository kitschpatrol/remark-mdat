// This is a code sample for testing purposes
import type { Rules } from '../../src/lib/mdat/rules'
import path from 'node:path'

export default {
	basic: '**A bold statement from test-rules.ts**',
	'basic-dynamic': {
		content() {
			return `I was generated from ${path.basename(import.meta.url)}`
		},
	},
	'basic-dynamic-no-metadata'() {
		return `I was generated from ${path.basename(import.meta.url)}`
	},
	'basic-empty': '',
	'basic-inline': {
		content() {
			return `${path.basename(import.meta.url)}`
		},
	},
	'basic-list': {
		order: 1,
		content: `- I\n- am\n- a\n- list`,
	},
	'basic-multiple-paragraphs': 'I am a paragraph 1\n\nI am a paragraph 2\n\nI am a paragraph 3',
	'basic-options': {
		content(options): string {
			// Check if options is object
			if (typeof options !== 'object') {
				throw new TypeError('Options must be an object')
			}

			const resolvedOptions = {
				prefix: '',
				suffix: '',
				...options,
			}

			return `${resolvedOptions.prefix}I am between two ferns${resolvedOptions.suffix}`
		},
	},
	'basic-throws': {
		content() {
			throw new Error('I am a rule that always throws an error')
		},
	},
} satisfies Rules
