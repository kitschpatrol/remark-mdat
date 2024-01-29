import { parseCommentText, splitHtmlIntoMdastNodes } from '../src/lib/parse'
import { describe, expect, it } from 'vitest'

// TODO
// describe('expandString', () => {
// 	it('should expand comments and handle arguments', async () => {
// 		const markdown = await fs.readFile('./test/assets/readme-basic.md', 'utf8')
// 		const { expanded: expandedString } = await expandString(markdown, {
// 			expansionRules: presets.readme,
// 		})
// 		expect(expandedString).toMatchSnapshot()
// 	})

// 	it('should expand special header and footer comments', async () => {
// 		const markdown = await fs.readFile('./test/assets/readme-header-footer.md', 'utf8')
// 		const { expanded: expandedString } = await expandString(markdown, {
// 			expansionRules: presets.readme,
// 		})
// 		expect(expandedString).toMatchSnapshot()
// 	})

// 	it('should expand prefixed comments', async () => {
// 		const markdown = await fs.readFile('./test/assets/readme-basic-prefixed.md', 'utf8')
// 		const { expanded: expandedString } = await expandString(markdown, {
// 			expansionRules: presets.readme,
// 			keywordPrefix: 'tp.',
// 		})
// 		expect(expandedString).toMatchSnapshot()
// 	})
// })

describe('multi comment parsing', () => {
	it('not parse multi-comment html text', () => {
		splitHtmlIntoMdastNodes('<!-- basic {something: 1} -->')
		const result = splitHtmlIntoMdastNodes('<!-- basic --><!-- basic -->Z')

		console.log(`result: ${JSON.stringify(result, undefined, 2)}`)

		splitHtmlIntoMdastNodes('<!-- basic({something: "yes"}) --><b>Absolutely</b><!-- basic -->')
		splitHtmlIntoMdastNodes('<!-- basic --><!-- basic -->')
		splitHtmlIntoMdastNodes(' <!-- basic --><!-- basic -->')
		splitHtmlIntoMdastNodes(' <!-- basic -->')
	})
})

describe('basic keyword parsing', () => {
	const basicResult = { args: undefined, keyword: 'title' }
	const basicResultPrefixed = { args: undefined, keyword: 'tp.title' }

	it('should not parse non-comments', () => {
		expect(parseCommentText('<!- title')).toEqual(undefined)
		expect(parseCommentText('<!!-- title() -->')).toEqual(undefined)
		expect(parseCommentText('title() -->')).toEqual(undefined)
	})

	it('should parse basic comments', () => {
		expect(parseCommentText('<!-- title -->')).toEqual(basicResult)
		expect(parseCommentText('<!-- title() -->')).toEqual(basicResult)
	})

	it('should forgive spacing variations', () => {
		expect(parseCommentText('<!--     title -->')).toEqual(basicResult)
		expect(parseCommentText('<!-- title-->')).toEqual(basicResult)
		expect(parseCommentText('<!--title -->')).toEqual(basicResult)
		expect(parseCommentText('<!--title-->')).toEqual(basicResult)
		expect(parseCommentText('<!--title()-->')).toEqual(basicResult)
		expect(parseCommentText('<!--title (  )-->')).toEqual(basicResult)
		expect(parseCommentText('<!-- title (  )  -->')).toEqual(basicResult)
		expect(parseCommentText('<!--     title-->')).toEqual(basicResult)
		expect(parseCommentText('<!--title-->')).toEqual(basicResult)
	})

	it('should forgive extra garbage in basic comments', () => {
		expect(parseCommentText('<!--// title -->')).toEqual(basicResult)
		expect(parseCommentText('<!--/// title -->')).toEqual(basicResult)
		expect(parseCommentText('<!--#title -->')).toEqual(basicResult)
		expect(parseCommentText('<!--####title -->')).toEqual(basicResult)
		expect(parseCommentText('<!-- #### title -->')).toEqual(basicResult)
	})

	it('should parse prefixed comments', () => {
		expect(parseCommentText('<!-- tp.title -->')).toEqual(basicResultPrefixed)
	})

	// TODO case handling
})

describe('keyword option argument parsing', () => {
	const stringResult = { args: { prefix: '😬' }, keyword: 'title' }
	const numberResult = { args: { prefix: 1 }, keyword: 'title' }
	const booleanResult = { args: { prefix: true }, keyword: 'title' }

	it('should parse basic options', () => {
		expect(parseCommentText('<!-- title({prefix: "😬"}) -->')).toEqual(stringResult)
		expect(parseCommentText('<!-- title({prefix: 1}) -->')).toEqual(numberResult)
		expect(parseCommentText('<!-- title({prefix: true}) -->')).toEqual(booleanResult)
	})

	it('should parse without parentheses', () => {
		expect(parseCommentText('<!-- title{prefix: "😬"} -->')).toEqual(stringResult)
		expect(parseCommentText('<!-- title{prefix: 1} -->')).toEqual(numberResult)
		expect(parseCommentText('<!-- title{prefix: true} -->')).toEqual(booleanResult)
	})

	it('should forgive spacing variations', () => {
		expect(parseCommentText('<!-- title{prefix: "😬"} -->')).toEqual(stringResult)
		expect(parseCommentText('<!--title{  prefix:   "😬" }-->')).toEqual(stringResult)
		expect(parseCommentText('<!-- title {prefix: 1}-->')).toEqual(numberResult)
		expect(parseCommentText('<!--title   {prefix: true} -->')).toEqual(booleanResult)
		expect(parseCommentText('<!-- title({prefix: "😬"}) -->')).toEqual(stringResult)
		expect(parseCommentText('<!--title({  prefix:   "😬" })-->')).toEqual(stringResult)
		expect(parseCommentText('<!-- title ({prefix: 1})-->')).toEqual(numberResult)
		expect(parseCommentText('<!--title   ({prefix: true}) -->')).toEqual(booleanResult)
	})
})

// TODO
// describe('linting', () => {
// 	it('should not report errors when linted and valid', async () => {
// 		const markdown = await fs.readFile('./test/assets/readme-basic.md', 'utf8')
// 		const lintReport = await validateString(markdown, { expansionRules: presets.readme })

// 		expect(lintReport).toEqual(true)
// 	})

// 	it('should report errors when linted and invalid', async () => {
// 		const markdown = await fs.readFile('./test/assets/readme-basic-invalid.md', 'utf8')
// 		const lintReport = await validateString(markdown, { expansionRules: presets.readme })

// 		expect(lintReport).not.toBe(true)
// 		expect(lintReport).toHaveLength(7)
// 	})
// })