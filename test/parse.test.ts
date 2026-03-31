import { describe, expect, it } from 'vitest'
import { parseComment } from '../src/lib/mdat/parse'

describe('basic comment keyword parsing', () => {
	const basicOptions = {
		keywordPrefix: '',
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
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title() -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title() -->",
			  "keyword": "title",
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title-->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title -->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title()-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title()-->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title (  )-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title (  )-->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!-- title (  )  -->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title (  )  -->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--     title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--     title-->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!--title-->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!--title-->",
			  "keyword": "title",
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---- title ----->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!---- title ----->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
		expect(parseComment('<!---title--->', basicOptions)).toMatchInlineSnapshot(`
			{
			  "html": "<!---title--->",
			  "keyword": "title",
			  "keywordPrefix": "",
			  "options": {},
			  "type": "open",
			}
		`)
	})

	const basicOptionsPrefixed = {
		keywordPrefix: 'tp.',
		metaCommentIdentifier: '+',
	}

	it('should parse prefixed comments', () => {
		expect(parseComment('<!-- tp.title -->', basicOptionsPrefixed)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- tp.title -->",
			  "keyword": "title",
			  "keywordPrefix": "tp.",
			  "options": {},
			  "type": "open",
			}
		`)
	})
})

describe('keyword option argument parsing', () => {
	const options = {
		keywordPrefix: '',
		metaCommentIdentifier: '+',
	}

	it('should parse basic options', () => {
		expect(parseComment('<!-- title({prefix: "😬"}) -->', options)).toMatchInlineSnapshot(`
			{
			  "html": "<!-- title({prefix: "😬"}) -->",
			  "keyword": "title",
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
			  "keywordPrefix": "",
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
		keywordPrefix: '',
		metaCommentIdentifier: '+',
	}

	it('should identify opening comments', () => {
		expect(parseComment('<!-- some-keyword -->', options)).toEqual({
			html: '<!-- some-keyword -->',
			keyword: 'some-keyword',
			keywordPrefix: '',
			options: {},
			type: 'open',
		})
	})

	it('should identify snug opening comments', () => {
		expect(parseComment('<!--some-keyword-->', options)).toEqual({
			html: '<!--some-keyword-->',
			keyword: 'some-keyword',
			keywordPrefix: '',
			options: {},
			type: 'open',
		})
	})

	it('should identify closing comments', () => {
		expect(parseComment('<!-- /some-keyword -->', options)).toEqual({
			html: '<!-- /some-keyword -->',
			keyword: 'some-keyword',
			keywordPrefix: '',
			options: {},
			type: 'close',
		})
	})

	it('should identify snug closing comments', () => {
		expect(parseComment('<!--/some-keyword-->', options)).toEqual({
			html: '<!--/some-keyword-->',
			keyword: 'some-keyword',
			keywordPrefix: '',
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

	const nativeOptions = {
		keywordPrefix: 'tp.',
		metaCommentIdentifier: '+',
	}

	it('should identify native comments', () => {
		expect(parseComment('<!-- I am a native comment -->', nativeOptions)).toEqual({
			content: 'I am a native comment',
			html: '<!-- I am a native comment -->',
			type: 'native',
		})
	})
})
