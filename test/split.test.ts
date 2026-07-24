// @case-police-ignore Html

import type { Html } from 'mdast'
import { describe, expect, it } from 'vitest'
import { splitHtmlIntoMdastNodes } from '../src/lib/mdast-utils/mdast-util-mdat-split'

function stringToMdastNode(value: string, startColumn = 1, startLine = 1): Html {
	const lines = value.split('\n')
	const lastLine = lines.at(-1)!
	const endLine = startLine + lines.length - 1
	const endColumn = lines.length === 1 ? startColumn + value.length : lastLine.length + 1
	const startOffset = 0
	const endOffset = value.length

	return {
		position: {
			start: { column: startColumn, line: startLine, offset: startOffset },
			end: { column: endColumn, line: endLine, offset: endOffset },
		},
		type: 'html',
		value,
	}
}

describe('multi comment parsing', () => {
	it('parse multi-comment html text', () => {
		expect(splitHtmlIntoMdastNodes(stringToMdastNode('<!-- basic({something: 1}) -->')))
			.toMatchInlineSnapshot(`
				[
				  {
				    "position": {
				      "end": {
				        "column": 31,
				        "line": 1,
				        "offset": 30,
				      },
				      "start": {
				        "column": 1,
				        "line": 1,
				        "offset": 0,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic({something: 1}) -->",
				  },
				]
			`)
		expect(splitHtmlIntoMdastNodes(stringToMdastNode('<!-- basic --><!-- basic -->Z')))
			.toMatchInlineSnapshot(`
				[
				  {
				    "position": {
				      "end": {
				        "column": 15,
				        "line": 1,
				        "offset": 14,
				      },
				      "start": {
				        "column": 1,
				        "line": 1,
				        "offset": 0,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				  {
				    "position": {
				      "end": {
				        "column": 29,
				        "line": 1,
				        "offset": 28,
				      },
				      "start": {
				        "column": 15,
				        "line": 1,
				        "offset": 14,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				  {
				    "position": {
				      "end": {
				        "column": 30,
				        "line": 1,
				        "offset": 29,
				      },
				      "start": {
				        "column": 29,
				        "line": 1,
				        "offset": 28,
				      },
				    },
				    "type": "text",
				    "value": "Z",
				  },
				]
			`)
		expect(
			splitHtmlIntoMdastNodes(
				stringToMdastNode('<!-- basic({something: "yes"}) --><b>Absolutely</b><!-- basic -->'),
			),
		).toMatchInlineSnapshot(`
			[
			  {
			    "position": {
			      "end": {
			        "column": 35,
			        "line": 1,
			        "offset": 34,
			      },
			      "start": {
			        "column": 1,
			        "line": 1,
			        "offset": 0,
			      },
			    },
			    "type": "html",
			    "value": "<!-- basic({something: "yes"}) -->",
			  },
			  {
			    "position": {
			      "end": {
			        "column": 52,
			        "line": 1,
			        "offset": 51,
			      },
			      "start": {
			        "column": 35,
			        "line": 1,
			        "offset": 34,
			      },
			    },
			    "type": "html",
			    "value": "<b>Absolutely</b>",
			  },
			  {
			    "position": {
			      "end": {
			        "column": 66,
			        "line": 1,
			        "offset": 65,
			      },
			      "start": {
			        "column": 52,
			        "line": 1,
			        "offset": 51,
			      },
			    },
			    "type": "html",
			    "value": "<!-- basic -->",
			  },
			]
		`)
		expect(splitHtmlIntoMdastNodes(stringToMdastNode('<!-- basic --><!-- basic -->')))
			.toMatchInlineSnapshot(`
				[
				  {
				    "position": {
				      "end": {
				        "column": 15,
				        "line": 1,
				        "offset": 14,
				      },
				      "start": {
				        "column": 1,
				        "line": 1,
				        "offset": 0,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				  {
				    "position": {
				      "end": {
				        "column": 29,
				        "line": 1,
				        "offset": 28,
				      },
				      "start": {
				        "column": 15,
				        "line": 1,
				        "offset": 14,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				]
			`)
		expect(splitHtmlIntoMdastNodes(stringToMdastNode(' <!-- basic --><!-- basic -->')))
			.toMatchInlineSnapshot(`
				[
				  {
				    "position": {
				      "end": {
				        "column": 2,
				        "line": 1,
				        "offset": 1,
				      },
				      "start": {
				        "column": 1,
				        "line": 1,
				        "offset": 0,
				      },
				    },
				    "type": "text",
				    "value": " ",
				  },
				  {
				    "position": {
				      "end": {
				        "column": 16,
				        "line": 1,
				        "offset": 15,
				      },
				      "start": {
				        "column": 2,
				        "line": 1,
				        "offset": 1,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				  {
				    "position": {
				      "end": {
				        "column": 30,
				        "line": 1,
				        "offset": 29,
				      },
				      "start": {
				        "column": 16,
				        "line": 1,
				        "offset": 15,
				      },
				    },
				    "type": "html",
				    "value": "<!-- basic -->",
				  },
				]
			`)
		expect(splitHtmlIntoMdastNodes(stringToMdastNode(' <!-- basic -->'))).toMatchInlineSnapshot(`
			[
			  {
			    "position": {
			      "end": {
			        "column": 2,
			        "line": 1,
			        "offset": 1,
			      },
			      "start": {
			        "column": 1,
			        "line": 1,
			        "offset": 0,
			      },
			    },
			    "type": "text",
			    "value": " ",
			  },
			  {
			    "position": {
			      "end": {
			        "column": 16,
			        "line": 1,
			        "offset": 15,
			      },
			      "start": {
			        "column": 2,
			        "line": 1,
			        "offset": 1,
			      },
			    },
			    "type": "html",
			    "value": "<!-- basic -->",
			  },
			]
		`)
		// TODO Currently not supported! Separate pass for expansion inside HTML?
		expect(
			splitHtmlIntoMdastNodes(
				stringToMdastNode('<!-- basic --><b><!-- basic --></b><!-- basic -->'),
			),
		).toMatchInlineSnapshot(`
			[
			  {
			    "position": {
			      "end": {
			        "column": 15,
			        "line": 1,
			        "offset": 14,
			      },
			      "start": {
			        "column": 1,
			        "line": 1,
			        "offset": 0,
			      },
			    },
			    "type": "html",
			    "value": "<!-- basic -->",
			  },
			  {
			    "position": {
			      "end": {
			        "column": 36,
			        "line": 1,
			        "offset": 35,
			      },
			      "start": {
			        "column": 15,
			        "line": 1,
			        "offset": 14,
			      },
			    },
			    "type": "html",
			    "value": "<b><!-- basic --></b>",
			  },
			  {
			    "position": {
			      "end": {
			        "column": 50,
			        "line": 1,
			        "offset": 49,
			      },
			      "start": {
			        "column": 36,
			        "line": 1,
			        "offset": 35,
			      },
			    },
			    "type": "html",
			    "value": "<!-- basic -->",
			  },
			]
		`)
		// TODO Currently not supported! Separate pass for expansion inside HTML?
		expect(splitHtmlIntoMdastNodes(stringToMdastNode('<b><!-- basic --></b>')))
			.toMatchInlineSnapshot(`
				[
				  {
				    "position": {
				      "end": {
				        "column": 22,
				        "line": 1,
				        "offset": 21,
				      },
				      "start": {
				        "column": 1,
				        "line": 1,
				        "offset": 0,
				      },
				    },
				    "type": "html",
				    "value": "<b><!-- basic --></b>",
				  },
				]
			`)
	})

	it('should calculate correct end column for multi-line html nodes', () => {
		// Simulate a multi-line HTML node starting at column 5, line 3
		const multiLineValue = '<!-- a -->\n<!-- b -->'
		const result = splitHtmlIntoMdastNodes(stringToMdastNode(multiLineValue, 5, 3))

		// First node: <!-- a --> on fragment line 1, column offset applies
		expect(result[0]!.position?.start).toEqual({ column: 5, line: 3, offset: 0 })
		expect(result[0]!.position?.end).toEqual({ column: 15, line: 3, offset: 10 })

		// Middle node: newline text, starts on fragment line 1, ends on line 2
		expect(result[1]!.position?.start).toEqual({ column: 15, line: 3, offset: 10 })
		expect(result[1]!.position?.end).toEqual({ column: 1, line: 4, offset: 11 })

		// Third node: <!-- b --> on fragment line 2, column should NOT be offset
		expect(result[2]!.position?.start).toEqual({ column: 1, line: 4, offset: 11 })
		expect(result[2]!.position?.end).toEqual({ column: 11, line: 4, offset: 21 })
	})
})
