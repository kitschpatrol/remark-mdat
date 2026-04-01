<!-- title -->

# remark-mdat

<!-- /title -->

<!-- badges { custom: {
    "CI": {
      image: "https://github.com/kitschpatrol/remark-mdat/actions/workflows/ci.yml/badge.svg",
      link: "https://github.com/kitschpatrol/remark-mdat/actions/workflows/ci.yml",
    },
  }
}
-->

[![NPM Package remark-mdat](https://img.shields.io/npm/v/remark-mdat.svg)](https://npmjs.com/package/remark-mdat)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/kitschpatrol/remark-mdat/actions/workflows/ci.yml/badge.svg)](https://github.com/kitschpatrol/remark-mdat/actions/workflows/ci.yml)

<!-- /badges -->

<!-- description -->

**A remark plugin implementing the Markdown Autophagic Template (MDAT) system.**

<!-- /description -->

> [!NOTE]
>
> **Please see The [`mdat` package](https://github.com/kitschpatrol/mdat) for a higher-level CLI tool and library with a collection of built-in expansion rules.**

<!-- table-of-contents -->

## Table of contents

- [Overview](#overview)
- [Getting started](#getting-started)
  - [Dependencies](#dependencies)
  - [Installation](#installation)
- [Usage](#usage)
  - [API](#api)
  - [Examples](#examples)
- [Utilities](#utilities)
- [Migrating from remark-mdat 1.x to 2.x](#migrating-from-remark-mdat-1x-to-2x)
- [Implementation notes](#implementation-notes)
- [Maintainers](#maintainers)
- [Acknowledgments](#acknowledgments)
- [Contributing](#contributing)
- [License](#license)

<!-- /table-of-contents -->

## Overview

This is a [remark](https://remark.js.org) plugin that automates the inline expansion of placeholder HTML comments with dynamic content in Markdown, making it easy to keep readme files and other documentation in sync with an external single source of truth.

The plugin finds placeholder comments in a Markdown file like this:

```md
<!-- title -->
```

And expands them with the data of your choosing. In this case, it reads the `title` field a nearby `package.json`:

```md
<!-- title -->

# remark-mdat

<!-- /title -->
```

This plugin powers the higher-level [`mdat` package](https://github.com/kitschpatrol/mdat), which is a better place to start if you just want to expand some comments and aren't working directly with remark processing pipelines.

## Getting started

### Dependencies

This library is ESM only and requires Node 20.19.6+. It's designed to work with Remark 15. `remark-mdat` is implemented in TypeScript and bundles a complete set of type definitions.

### Installation

```sh
pnpm add remark-mdat
```

## Usage

### API

#### Core plugin

This package's default export implements the unified [Plugin](https://github.com/unifiedjs/unified#plugin) type.

The plugin is integrated into a remark process chain via the `.use()` method:

```ts
import { remark } from 'remark'
import remarkMdat from 'remark-mdat'

remark().use(remarkMdat)
```

#### Options

The plugin accepts an optional `Rules` object as its options. This is a `Record<string, Rule>` where each key is a keyword matching an HTML comment in the Markdown file (e.g. `title` matches `<!-- title -->`).

HTML comments using code-style notation (`<!-- // ... -->`, `<!-- # ... -->`, `<!-- /* ... */ -->`) are ignored and will not be treated as mdat keywords. Rule keywords cannot start with `/`, `*`, or `#`.

A `Rule` value can take several forms:

```ts
const rules: Rules = {
  // String: direct replacement
  greeting: 'Hello, world!',

  // Function: dynamic content (sync or async)
  time: () => new Date().toDateString(),

  // Function with arguments: receives parsed options from the comment
  personalGreeting: (options) => `Hello, ${options.name}!`,

  // Object: with processing priority
  title: {
    order: 1, // Runs after other rules (default is 0)
    content: () => getTitle(), // String, function, or array
  },

  // Array: compound rule combining multiple sub-rules
  header: ['# My Project', () => getDescription()],

  // Function with context: access the document tree, frontmatter, and file path
  toc: (_options, context) => generateTocFromTree(context.tree),
}
```

#### Rule context

Rule content functions receive a `RuleContext` object as their second argument, providing access to the document being processed:

```ts
type RuleContext = {
  /** File path of the source document, if known. */
  filePath: string | undefined
  /** Parsed YAML frontmatter from the document, if present. */
  frontmatter: Record<string, unknown> | undefined
  /** The full mdast AST of the document. Do not mutate. */
  tree: Root
}
```

Frontmatter is automatically extracted if available. If the document has no frontmatter block, `context.frontmatter` remains `undefined`.

```ts
const rules: Rules = {
  // Access frontmatter values
  title: (_options, context) => `# ${context.frontmatter?.title ?? 'Untitled'}`,

  // Use the file path
  source: (_options, context) => `Source: ${context.filePath ?? 'unknown'}`,

  // Traverse the AST
  toc: (_options, context) => generateTocFromTree(context.tree),
}
```

#### Passing arguments to rules

Arguments are passed using function-call syntax: `<!-- keyword(...) -->`. The value inside the parentheses is parsed as [JSON5](https://json5.org/), which means unquoted keys and single quotes are allowed.

```md
Options as JSON5 (unquoted keys, single quotes):

<!-- greeting({name: 'Alice', shout: true}) -->

Options as strict JSON:

<!-- greeting({"name": "Alice", "shout": true}) -->

Single primitive value:

<!-- repeat(3) -->
```

Prefer object arguments over single primitive values for all but the most contextually clear argument values.

Any JSON5 value is supported: objects, arrays, strings, numbers, and booleans. Comments without parentheses receive an empty object `{}` as their options.

For simplicity's sake, only a single argument position is supported. If you need pass multiple arguments, wrap them in an object. For security's sake, only JSON5 / JSON values are permitted in keyword arguments, no JavaScript is evaluated.

### Examples

#### Basic

`remark-mdat` includes one test rule by default, `<!-- mdat -->`.

```ts
import { remark } from 'remark'
import remarkMdat from 'remark-mdat'

const markdownInput = '<!-- mdat -->'
const markdownOutput = await remark().use(remarkMdat).process(markdownInput)

console.log(markdownOutput.toString())

// Logs:
// <!-- mdat -->
//
// Powered by the Markdown Autophagic Template system: [mdat](https://github.com/kitschpatrol/mdat).
//
// <!-- /mdat -->
```

#### With rules

If you wanted to replace `<!-- time -->` comments in your Markdown file with the current time, you could pass in a rule:

```ts
import type { Rules } from 'remark-mdat'
import { remark } from 'remark'
import remarkMdat from 'remark-mdat'

// Create the rules
const rules: Rules = {
  time: new Date().toDateString(),
}

const markdownInput = '<!-- time -->'

// Pass the rules to remarkMdat
const markdownOutput = await remark().use(remarkMdat, rules).process(markdownInput)

console.log(markdownOutput.toString())

// Logs:
// <!-- time -->
//
// Mon April 01 2026
//
// <!-- /time -->
```

See the [`mdat`](https://github.com/kitschpatrol/mdat) package for a higher-level API and CLI that can operate directly on files or strings. It also provides dynamic rule loading and configuration resolution, and bundles a collection of rules convenient for use in readme files.

## Utilities

The plugin bundles a number of [mdast](https://github.com/syntax-tree/mdast) utilities designed to operate directly on syntax trees. These are exported to support customized Unified.js processors and enforce modularity and separation of concerns in mdat's internal implementation, but you do not need to use them directly — all functionality is encapsulated in the single `remarkMdat` plugin export.

The remark-mdat plugin chains these utilities together to accommodate the typical use case of end-to-end expansion of mdat comments. For now, the individual utility transformers are not published individually to NPM, and are instead bundled with `remark-mdat`.

Errors and warnings are reported inline during expansion via [VFile messages](https://github.com/vfile/vfile-message), following remark ecosystem conventions. Use `reporterMdat` to extract and format these messages for console output.

- [**`mdast-util-mdat`**](./src/lib/mdast-utils/mdast-util-mdat.ts)

  Composite transformer function performing end-to-end mdat comment expansion on Markdown ASTs by chaining the other utility functions described below.

  _Exported as `mdat(tree: Root, file: VFile, rules: Rules): Promise<void>`_

  Utilities wrapped by `mdast-util-mdat`:
  - [**`mdast-util-mdat-split`**](./src/lib/mdast-utils/mdast-util-mdat-split.ts)

    Transformer function that splits multi-comment HTML nodes into individual mdast nodes, allowing inline mdat expansion comments.

    _Exported as `mdatSplit(tree: Root, file: VFile): void`_

  - [**`mdast-util-mdat-clean`**](./src/lib/mdast-utils/mdast-util-mdat-clean.ts)

    Transformer function that resets all mdat comment expansions in a file, collapsing expanded comments back into single-line placeholders.

    _Exported as `mdatClean(tree: Root, file: VFile): void`_

  - [**`mdast-util-mdat-expand`**](./src/lib/mdast-utils/mdast-util-mdat-expand.ts)

    Transformer function that expands mdat comments (e.g. `<!-- title -->`) in a Markdown file according to the provided rules. Reports errors for rules that throw or return empty content, and warnings for comments with no matching rule.

    _Exported as `mdatExpand(tree: Root, file: VFile, rules: Rules): Promise<void>`_

## Migrating from remark-mdat 1.x to 2.x

Version 2.0 simplifies and solidifies the API by removing several configuration options and validation features that added complexity without sufficient benefit. The core expansion behavior is unchanged — the plugin still matches HTML comments to rules and expands them — but the way you configure it has changed.

### Options are now just rules

In 1.x, the plugin accepted an options object with multiple fields to customize parsing and generation:

```ts
// 1.x
remark().use(remarkMdat, {
  rules: { title: () => '# My Title' },
  addMetaComment: true,
  closingPrefix: '/',
  keywordPrefix: 'mm-',
  metaCommentIdentifier: '+',
})
```

In 2.x, the plugin hard-codes opinionated approach to parsing and only accepts a `Rules` record directly:

```ts
// 2.x
remark().use(remarkMdat, {
  title: () => '# My Title',
})
```

The `Options` type is now an alias for `Rules`. If you were importing `MdatOptions`, `MdatExpandOptions`, `MdatCheckOptions`, or `MdatCleanOptions`, replace them with `Rules`.

### Removed options

The following plugin options have been removed entirely:

| Removed option          | Migration                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| `addMetaComment`        | Remove. Auto-generated warning comments are no longer supported.         |
| `metaCommentIdentifier` | Remove. The `<!--+ ... +-->` meta comment syntax is gone.                |
| `closingPrefix`         | Remove. The closing prefix is now always `/` (e.g. `<!-- /keyword -->`). |
| `keywordPrefix`         | Remove. Keyword prefixing / namespacing is no longer supported.          |

### Removed rule properties

| Removed property | Migration                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `required`       | Remove. All rules are treated equally. Missing comments produce a warning instead of an error.                                                    |
| `order           | Remove. The 1.x `order` property enforced comment _position_ in the document. In 2.x, `order` controls _processing priority_ only (default: `0`). |

### Changed rule properties

| Changed property   | Migration          |
| ------------------ | ------------------ |
| `applicationOrder` | Change to `order`. |

### Removed validation utility

The `mdast-util-mdat-check` utility and its export `mdatCheck` have been removed. Validation logic (missing rules, empty content, rule errors) is now handled inline during expansion by `mdatExpand`, which reports issues as VFile messages. Use `reporterMdat` to format and display these messages.

### Rule function signature change

In 1.x, rule content functions received the mdast tree directly as the second argument:

```ts
// 1.x
const rules = {
  toc: (_options, tree) => generateTocFromTree(tree),
}
```

In 2.x, the second argument is a `RuleContext` object containing the tree, parsed frontmatter, and file path:

```ts
// 2.x
const rules = {
  toc: (_options, context) => generateTocFromTree(context.tree),
}
```

### Stricter argument syntax

In 1.x, the argument parser was very permissive — parentheses were optional, bare key-value pairs were auto-wrapped in braces, and space-separated arguments worked:

```md
<!-- greeting name: "Alice" -->
<!-- greeting {name: "Alice"} -->
<!-- greeting({name: "Alice"}) -->
```

In 2.x, arguments **must** use function-call syntax with parentheses. The content inside the parentheses is parsed as [JSON5](https://json5.org/):

```md
<!-- greeting({name: 'Alice'}) -->
```

Bare or space-separated arguments like `<!-- greeting name: "Alice" -->` will no longer be parsed — the extra text after the keyword is ignored and the rule receives an empty `{}` options object.

As a trade-off for the stricter syntax, primitive values are now supported as arguments: `<!-- repeat(3) -->`, `<!-- show("hello") -->`.

### Comment-style comments are ignored

HTML comments using code-style prefixes (`<!-- // ... -->`, `<!-- # ... -->`, `<!-- /* ... */ -->`) are now ignored by the parser, so you can use them for regular comments alongside mdat keywords without triggering warnings. This replaces 1.x parser configuration options like `keywordPrefix`.

### Compound rule error handling

In 1.x, a failing sub-rule in a compound rule (array of rules) caused the entire expansion to fail. In 2.x, individual sub-rule failures are reported as warnings and skipped — the expansion only fails if every sub-rule fails.

### Removed export: `deepMergeDefined`

The `deepMergeDefined` utility has been moved to the [`mdat`](https://github.com/kitschpatrol/mdat) package. If you were importing it from `remark-mdat`, import it from `mdat` instead.

## Implementation notes

This project was split from a monorepo containing both `mdat` and `remark-mdat` into separate repos in July 2024.

The API was redesigned and simplified for version 2 in March 2026.

Remark is not a peer dependency on account of this discussion: [strip-markdown/issues/24](https://github.com/remarkjs/strip-markdown/issues/24)

## Maintainers

[@kitschpatrol](https://github.com/kitschpatrol)

## Acknowledgments

Thanks to the [unified team](https://github.com/orgs/unifiedjs/people) for their superb ecosystem of AST tools.

<!-- footer -->

## Contributing

[Issues](https://github.com/kitschpatrol/remark-mdat/issues) and pull requests are welcome.

## License

[MIT](license.txt) © Eric Mika

<!-- /footer -->
