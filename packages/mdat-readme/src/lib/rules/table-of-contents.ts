import { type Root } from 'mdast'
import { toc } from 'mdast-util-toc'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Rules } from 'remark-mdat'

export default {
	'table-of-contents': {
		// Apply towards the end so any generated headings are available
		applicationOrder: 1,
		// eslint-disable-next-line @typescript-eslint/require-await
		async content(_, ast) {
			// eslint-disable-next-line unicorn/no-null
			const result = toc(ast, { heading: null, tight: true })

			const heading = `## Table of contents`

			if (result.map === undefined) {
				throw new Error('Could not generate table of contents')
			}

			const rootWrapper: Root = {
				children: result.map.children,
				type: 'root',
			}

			// The "tight" option set above on toc() doesn't seem to work unless TOC has nested
			// items, so we strip out blank lines ourselves for non-tested TOCs
			const tocString = remark().use(remarkGfm).stringify(rootWrapper).replaceAll('\n\n', '\n')

			return [heading, tocString].join('\n')
		},
		order: 6,
	},
} satisfies Rules
