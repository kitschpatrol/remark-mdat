<!--+ Warning: Content inside HTML comment blocks was generated by mdat and may be overwritten. +-->

<!-- title -->

# remark-mdat

<!-- /title -->

<!-- badges -->

[![NPM Package remark-mdat](https://img.shields.io/npm/v/remark-mdat.svg)](https://npmjs.com/package/remark-mdat)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- /badges -->

<!-- description -->

**A remark plugin implementing the Markdown Autophagic Template (MDAT) system.**

<!-- /description -->

> \[!NOTE]\
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
- [Implementation notes](#implementation-notes)
- [The future](#the-future)
- [Maintainers](#maintainers)
- [Acknowledgements](#acknowledgements)
- [Contributing](#contributing)
- [License](#license)

<!-- /table-of-contents -->

## Overview

This is a [remark](https://remark.js.org) plugin that automates the inline expansion of placeholder HTML comments with dynamic content in Markdown, making it easy to keep readme files and other documentation in sync with an external single source of truth.

The plugin can take placeholder comments in a Markdown file like this:

```md
<!-- title -->
```

And replace it with dynamic data. In this case, from `package.json`:

```md
<!-- title -->

# remark-mdat

<!-- /title -->
```

This plugin powers the higher-level [`mdat` package](https://github.com/kitschpatrol/mdat), which is a better better place to start if you just want to expand some comments and aren't working directly with remark processing pipelines.

## Getting started

### Dependencies

This library is ESM only and requires Node 18 or newer. It's designed to work with Remark 15. `remark-mdat` is implemented in TypeScript and bundles a complete set of type definitions.

### Installation

```sh
npm install remark-mdat
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

The plugin accepts an optional options object which exposes some configuration options and, most importantly, determines how comments in the source Markdown file will be expanded via the `rules` field:

```ts
export type Options = {
  addMetaComment?: Boolean // default: false
  closingPrefix?: String // default: '/',
  keywordPrefix?: String // default: '',
  metaCommentIdentifier?: String // default: '+',
  rules?: Rules // default: a single test rule for the 'mdat' keyword
}
```

### Examples

#### Basic

`remark-mdat` includes one test rule by default, `<!-- mdat -->`.

```ts
import { remark } from 'remark'
import remarkMdat from 'remark-mdat'

const markdownInput = '<!-- mdat -->'
const markdownOutput = await remark().use(remarkMdat).process(markdown)

console.log(markdownOutput.toString())

// Logs:
// <!-- mdat -->
//
// Powered by the Markdown Autophagic Template system: [mdat](https://github.com/kitschpatrol/mdat).
//
// <!-- /mdat -->
```

#### With options

If you wanted to replace `<!-- time -->` comments in your Markdown file with the current time, you could pass in a rule:

```ts
import { remark } from 'remark'
import { type Rules, default as remarkMdat } from 'remark-mdat'

// Create the rule
const rules: Rules = {
  time: () => new Date().toDateString(),
}

const markdownInput = '<!-- time -->'

// Pass the time rule to remarkMdat
const markdownOutput = await remark().use(remarkMdat, { rules }).process(markdown)

console.log(markdownOutput.toString())

// Logs:
// <!-- time -->
//
// Mon Feb 05 2024
//
// <!-- /time -->
```

See the [`mdat`](https://github.com/kitschpatrol/mdat) package for a higher-level API and CLI that can operate directly on files or strings. It also provides dynamic rule loading and configuration resolution, and bundles a collection of rules convenient for use in readme files.

## Utilities

The plugin bundles a number of [mdast](https://github.com/syntax-tree/mdast) utilities designed to operate directly on syntax trees. These are exported to support customized Unified.js processors and enforce modularity and separation of concerns in mdat's internal implementation, but you do not need to use them directly — all functionality is encapsulated in the single `remarkMdat` plugin export.

The remark-mdat plugin chains these utilities together to accommodate the typical use case of end-to-end expansion and validation of mdat comments. For now, the individual utility transformers are not published individually to NPM, and are instead bundled with `remark-mdat`.

- [**`mdast-util-mdat`**](./src/lib/mdast-utils/mdast-util-mdat.ts)

  Composite transformer function performing end-to-end mdat comment expansion and validation on Markdown ASTs by chaining the other utility functions described below.

  _Exported as `mdat`_

  Utilities wrapped by `mdast-util-mdat`:

  - [**`mdast-util-mdat-split`**](./src/lib/mdast-utils/mdast-util-mdat-split.ts)

    Transformer function that allows inline mdat expansion comments.

    _Exported as `mdatSplit`_

  - [**`mdast-util-mdat-clean`**](./src/lib/mdast-utils/mdast-util-mdat-clean.ts)

    Transformer function that "resets" all mdat comment expansions in a file, collapsing expanded comments back into single-line placeholders.

    _Exported as `mdatClean`_

  - [**`mdast-util-mdat-expand`**](./src/lib/mdast-utils/mdast-util-mdat-expand.ts)

    Transformer function that expands mdat comments (e.g. `<!-- title -->`) in a Markdown file according to the rule set passed in to the `MdatExpandOptions` argument.

    _Exported as `mdatExpand`_

  - [**`mdast-util-mdat-check`**](./src/lib/mdast-utils/mdast-util-mdat-check.ts)

    Transformer function that validates an expanded Markdown document against the requirements defined in the rules passed in to the `MdatCheckOptions` argument.

    See `reporterMdat` to extract, format, and log results from VFile messages written by `mdatCheck`. This function does not modify the tree, it only appends messages to the VFiles passed through it.

    _Exported as `mdatCheck`_

## Implementation notes

This project was split from a monorepo containing both `mdat` and `remark-mdat` into separate repos in July 2024.

## The future

- Consider making remark a peer dependency? Though perhaps not [strip-markdown/issues/24](https://github.com/remarkjs/strip-markdown/issues/24)...

## Maintainers

[@kitschpatrol](https://github.com/kitschpatrol)

## Acknowledgements

Thanks to the [unified team](https://github.com/orgs/unifiedjs/people) for their superb ecosystem of AST tools.

<!-- footer -->

## Contributing

[Issues](https://github.com/kitschpatrol/remark-mdat/issues) and pull requests are welcome.

## License

[MIT](license.txt) © Eric Mika

<!-- /footer -->
