import { describe, expect, it } from 'vitest'
import { parseComment } from '../src/lib/mdat/parse'

describe('basic comment keyword parsing', () => {
	it('should not parse non-comments', () => {
		expect(parseComment('<!- title')).toBeUndefined()
		expect(parseComment('<!!-- title() -->')).toBeUndefined()
		expect(parseComment('title() -->')).toBeUndefined()
	})

	it('should parse basic comments', () => {
		expect(parseComment('<!-- title -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title() -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title() -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
	})

	it('should forgive spacing variations', () => {
		expect(parseComment('<!--     title -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--     title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title()-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title()-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title (  )-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title (  )-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title (  )  -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title (  )  -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--     title-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--     title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
	})

	it('should forgive extra garbage in basic comments', () => {
		expect(parseComment('<!------ title -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!------ title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---- title ----->')).toMatchInlineSnapshot(`
			{
			  "html": "<!---- title ----->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---title--->')).toMatchInlineSnapshot(`
			{
			  "html": "<!---title--->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
	})
})

describe('keyword option argument parsing', () => {
	it('should parse basic options', () => {
		expect(parseComment('<!-- title({prefix: "😬"}) -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: "😬"}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title({prefix: 1}) -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: 1}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title({prefix: true}) -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: true}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
	})

	it('should parse without parentheses', () => {
		expect(parseComment('<!-- title{prefix: "😬"} -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: "😬"} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title{prefix: 1} -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: 1} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title{prefix: true} -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: true} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
	})

	it('should parse bare json into an object', () => {
		expect(parseComment('<!-- title prefix: "😬" -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix: "😬" -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title prefix: 1 -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix: 1 -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title prefix: true -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix: true -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
	})

	it('should parse bare json with wonky spacing', () => {
		expect(parseComment('<!-- title prefix:   "😬"-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix:   "😬"-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title  prefix  : 1-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title  prefix  : 1-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title   prefix :     true    -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title   prefix :     true    -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
	})

	it('should forgive spacing variations', () => {
		expect(parseComment('<!-- title{prefix: "😬"} -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: "😬"} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title{  prefix:   "😬" }-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title{  prefix:   "😬" }-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title {prefix: 1}-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title {prefix: 1}-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title   {prefix: true} -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title   {prefix: true} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title({prefix: "😬"}) -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: "😬"}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title({  prefix:   "😬" })-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title({  prefix:   "😬" })-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title ({prefix: 1})-->')).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title ({prefix: 1})-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title   ({prefix: true}) -->')).toMatchInlineSnapshot(`
			{
			  "html": "<!--title   ({prefix: true}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
	})
})

describe('comment type detection', () => {
	it('should identify opening comments', () => {
		expect(parseComment('<!-- some-keyword -->')).toEqual({
			html: '<!-- some-keyword -->',
			keyword: 'some-keyword',
			options: {},
			type: 'open',
		})
	})

	it('should identify snug opening comments', () => {
		expect(parseComment('<!--some-keyword-->')).toEqual({
			html: '<!--some-keyword-->',
			keyword: 'some-keyword',
			options: {},
			type: 'open',
		})
	})

	it('should identify closing comments', () => {
		expect(parseComment('<!-- /some-keyword -->')).toEqual({
			html: '<!-- /some-keyword -->',
			keyword: 'some-keyword',
			options: {},
			type: 'close',
		})
	})

	it('should identify snug closing comments', () => {
		expect(parseComment('<!--/some-keyword-->')).toEqual({
			html: '<!--/some-keyword-->',
			keyword: 'some-keyword',
			options: {},
			type: 'close',
		})
	})
})

describe('code-style comment ignoring', () => {
	it('should ignore double-slash line comments', () => {
		expect(parseComment('<!-- // line comment -->')).toBeUndefined()
		expect(parseComment('<!-- // -->')).toBeUndefined()
		expect(parseComment('<!--//-->')).toBeUndefined()
		expect(parseComment('<!-- //note -->')).toBeUndefined()
		expect(parseComment('<!--//note-->')).toBeUndefined()
	})

	it('should ignore hash comments', () => {
		expect(parseComment('<!-- # hash comment -->')).toBeUndefined()
		expect(parseComment('<!-- # -->')).toBeUndefined()
		expect(parseComment('<!--#-->')).toBeUndefined()
		expect(parseComment('<!-- #todo -->')).toBeUndefined()
		expect(parseComment('<!--#todo-->')).toBeUndefined()
	})

	it('should ignore block comments', () => {
		expect(parseComment('<!-- /* block comment */ -->')).toBeUndefined()
		expect(parseComment('<!-- /* */ -->')).toBeUndefined()
		expect(parseComment('<!--/* snug */-->')).toBeUndefined()
		expect(parseComment('<!-- /*unterminated -->')).toBeUndefined()
	})

	it('should still parse closing tags', () => {
		expect(parseComment('<!-- /keyword -->')).toEqual({
			html: '<!-- /keyword -->',
			keyword: 'keyword',
			options: {},
			type: 'close',
		})
		expect(parseComment('<!--/keyword-->')).toEqual({
			html: '<!--/keyword-->',
			keyword: 'keyword',
			options: {},
			type: 'close',
		})
	})

	it('should still parse regular open tags', () => {
		expect(parseComment('<!-- keyword -->')).toEqual({
			html: '<!-- keyword -->',
			keyword: 'keyword',
			options: {},
			type: 'open',
		})
	})
})
