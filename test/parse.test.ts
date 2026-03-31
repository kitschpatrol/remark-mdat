import { describe, expect, it } from 'vitest'
import { parseComment } from '../src/lib/mdat/parse'

describe('basic comment keyword parsing', () => {
	const basicOptions = {
		metaCommentIdentifier: '+',
	}

	it('should not parse non-comments', () => {
		expect(parseComment('<!- title', basicOptions)).toBeUndefined()
		expect(parseComment('<!!-- title() -->', basicOptions)).toBeUndefined()
		expect(parseComment('title() -->', basicOptions)).toBeUndefined()
	})

	it('should parse basic comments', () => {
		expect(parseComment('<!-- title -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title() -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title() -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
	})

	it('should forgive spacing variations', () => {
		expect(parseComment('<!--     title -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--     title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title()-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title()-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title (  )-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title (  )-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title (  )  -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title (  )  -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--     title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--     title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
	})

	it('should forgive extra garbage in basic comments', () => {
		expect(parseComment('<!------ title -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!------ title -->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---- title ----->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!---- title ----->",
			  "keyword": "title",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---title--->', basicOptions)).toMatchInlineSnapshot(`
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
	const options = {
		metaCommentIdentifier: '+',
	}

	it('should parse basic options', () => {
		expect(parseComment('<!-- title({prefix: "😬"}) -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: "😬"}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title({prefix: 1}) -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: 1}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title({prefix: true}) -->', options)).toMatchInlineSnapshot(`
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
		expect(parseComment('<!-- title{prefix: "😬"} -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: "😬"} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title{prefix: 1} -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: 1} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title{prefix: true} -->', options)).toMatchInlineSnapshot(`
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
		expect(parseComment('<!-- title prefix: "😬" -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix: "😬" -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title prefix: 1 -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix: 1 -->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title prefix: true -->', options)).toMatchInlineSnapshot(`
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
		expect(parseComment('<!-- title prefix:   "😬"-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title prefix:   "😬"-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title  prefix  : 1-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title  prefix  : 1-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title   prefix :     true    -->', options)).toMatchInlineSnapshot(`
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
		expect(parseComment('<!-- title{prefix: "😬"} -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title{prefix: "😬"} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title{  prefix:   "😬" }-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title{  prefix:   "😬" }-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)

		expect(parseComment('<!-- title {prefix: 1}-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title {prefix: 1}-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title   {prefix: true} -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title   {prefix: true} -->",
			  "keyword": "title",
			  "options": {
			    "prefix": true,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title({prefix: "😬"}) -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: "😬"}) -->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title({  prefix:   "😬" })-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title({  prefix:   "😬" })-->",
			  "keyword": "title",
			  "options": {
			    "prefix": "😬",
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title ({prefix: 1})-->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title ({prefix: 1})-->",
			  "keyword": "title",
			  "options": {
			    "prefix": 1,
			  },
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title   ({prefix: true}) -->', options)).toMatchInlineSnapshot(`
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
	const options = {
		metaCommentIdentifier: '+',
	}

	it('should identify opening comments', () => {
		expect(parseComment('<!-- some-keyword -->', options)).toEqual({
			html: '<!-- some-keyword -->',
			keyword: 'some-keyword',
			options: {},
			type: 'open',
		})
	})

	it('should identify snug opening comments', () => {
		expect(parseComment('<!--some-keyword-->', options)).toEqual({
			html: '<!--some-keyword-->',
			keyword: 'some-keyword',
			options: {},
			type: 'open',
		})
	})

	it('should identify closing comments', () => {
		expect(parseComment('<!-- /some-keyword -->', options)).toEqual({
			html: '<!-- /some-keyword -->',
			keyword: 'some-keyword',
			options: {},
			type: 'close',
		})
	})

	it('should identify snug closing comments', () => {
		expect(parseComment('<!--/some-keyword-->', options)).toEqual({
			html: '<!--/some-keyword-->',
			keyword: 'some-keyword',
			options: {},
			type: 'close',
		})
	})

	it('should identify meta comments', () => {
		expect(parseComment('<!--+ I am a meta comment +-->', options)).toEqual({
			content: ' I am a meta comment ',
			html: '<!--+ I am a meta comment +-->',
			type: 'meta',
		})
	})
})
