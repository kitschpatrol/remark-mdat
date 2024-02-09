<!--+ Warning: Content in HTML comment blocks generated by mdat on 2024-02-08 +-->

<!-- header [{ titleCase: true }, {}, { custom: {
  "remark-mdat": {
    image: "https://img.shields.io/npm/v/remark-mdat.svg?label=remark-mdat",
    link: "https://npmjs.com/package/remark-mdat" },
  "mdat": {
    image: "https://img.shields.io/npm/v/mdat.svg?label=mdat",
    link: "https://npmjs.com/package/mdat" },
  "mdat-readme": {
    image: "https://img.shields.io/npm/v/mdat-readme.svg?label=mdat-readme",
    link: "https://npmjs.com/package/mdat-readme" },
}}] -->

# Mdat Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![remark-mdat](https://img.shields.io/npm/v/remark-mdat.svg?label=remark-mdat)](https://npmjs.com/package/remark-mdat)
[![mdat](https://img.shields.io/npm/v/mdat.svg?label=mdat)](https://npmjs.com/package/mdat)
[![mdat-readme](https://img.shields.io/npm/v/mdat-readme.svg?label=mdat-readme)](https://npmjs.com/package/mdat-readme)

**Use comments as dynamic content templates in Markdown files.**

<!-- /header -->

<!-- toc -->

## Table of contents

- [Overview](#overview)
- [Packages](#packages)
  - [mdat-readme](#mdat-readme)
  - [mdat](#mdat)
  - [remark-mdat](#remark-mdat)
- [Features](#features)
  - [1. Minimalist syntax](#1-minimalist-syntax)
  - [2. Single-comment placeholders](#2-single-comment-placeholders)
  - [3. Familiar JSON argument syntax](#3-familiar-json-argument-syntax)
  - [4. Flexible rule system](#4-flexible-rule-system)
  - [5. TypeScript native](#5-typescript-native)
  - [6. Validation](#6-validation)
  - [7. Compound rules](#7-compound-rules)
  - [8. Single-command readme workflow](#8-single-command-readme-workflow)
- [Background](#background)
  - [Motivation](#motivation)
  - [Similar projects](#similar-projects)
- [Acknowledgments](#acknowledgments)
- [The future](#the-future)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

<!-- /toc -->

## Overview

`mdat` stands for the **Markdown Autophagic Template** system. So-named because of its ouroboros-like approach to expanding comment placeholders in-place.

This monorepo currently consists of a collection of three tools offering various levels of abstraction for the comment-expansion process, with a special emphasis on automatically pulling content from a `package.json` file into your `readme.md`.

The general concept is introduced below, and each package also has its own readme that goes into more detail.

If you're in a hurry to get going, I recommend jumping to the [`mdat-readme`](./packages/mdat-readme/readme.md) package.

## Packages

This repository includes three packages, outlined below from highest- to lowest-level:

### [mdat-readme](./packages/mdat-readme/)

`mdat-readme` builds on the other packages in this repo to simplify common template expansion workflows, and comes out of the box with a presets for synchronizing `package.json` metadata to your readme.

**See the [mdat-readme readme file](./packages/mdat-readme/readme.md) for more.** It outlines how to automatically generate chunks of your readme in any project with a `package.json`, and walks through the collection of bundled rules provided.

### [mdat](./packages/mdat/)

<!-- mdat-description -->

**_CLI tool and library for using comments as content templates in Markdown files._**

<!-- /mdat-description -->

**See the [mdat readme file](./packages/mdat/readme.md) for more.** It explains how to use mdat comment templates with any Markdown file, how to create your own expansion rule sets, and configuration options.

### [remark-mdat](./packages/remark-mdat/)

<!-- remark-mdat-description -->

**_A remark plugin implementing the Markdown Autophagic Template (mdat) system._**

<!-- /remark-mdat-description -->

**See the [remark-mdat readme file](./packages/remark-mdat/readme.md) for more.** It demonstrates how to integrate an mdat template comment expansion step in more complex remark processing pipelines. Even lower level [unified](https://unifiedjs.com) [mdast](https://github.com/syntax-tree/mdast) utility functions are also available in the `remark-mdat` package for surgical work on Markdown ASTs.

## Features

As [noted below](#similar-projects), there are several similar projects out there. This overlap is mostly the result of my mediocre due diligence before starting development, but there remain a few distinguishing aspects of this particular implementation of the idea:

### 1. Minimalist syntax

No screaming caps or wordy opening and closing tag keywords, just a minimal HTML-esque syntax:

```md
<!-- title -->

# mdat

<!-- /title -->
```

(Optionally, you can specify a prefix if you want to mix "true" comments with `mdat` content placeholder comments.)

### 2. Single-comment placeholders

When you're roughing out a readme, you can drop in a single opening comment, and `mdat` will take care of expanding it and adding the closing tag the next time it's run. To generate the block shown above, you'd need only to add:

```md
<!-- title -->
```

### 3. Familiar JSON argument syntax

In the rare instances when you want to pass extra data or configuration into a comment template, you just use a bit of JSON. No need to grok a custom syntax:

```md
<!-- title { prefix: "🙃" } -->
```

Internally, comment option arguments are parsed with [JSON5](https://json5.org), so you can skip quoting keys if you like. A pre-parsing step adds another layer of leniency if you want to skip the brackets or include parentheses to pretend your keyword is a function. The expansion rules included in `mdat-readme` use [Zod](https://zod.dev) to validate the option arguments and provide helpful errors at runtime.

### 4. Flexible rule system

Comment expansions definitions are referred to as "rules".

An expansion rule can be as minimal as a file exporting a record:

```ts
{ keyword: "content"}`
```

Which will turn:

```md
<!-- keyword -->
```

Into:

```md
<!-- keyword -->

content

<!-- /keyword -->
```

Or, make things a bit more dynamic by returning a function instead of a string. Async functions are welcome.

```ts
{ date: () => `${new Date().toISOString()}` } }"
```

Or enforce validation by adding some metadata:

```ts
{
  date: {
    content: () => `${new Date().toISOString()}`,
    order: 1,
    required: true,
  },
}
```

This scales all the way up to some of the [more](./packages/mdat-readme/src/lib/rules/table-of-contents.ts) [elaborate](./packages/mdat-readme/src/lib/rules/cli-help) rules found in `mdat-readme`.

You can also treat any JSON file as a rule set. `mdat` will flatten it to allow any dot-notated key path to become a placeholder comment keyword.

### 5. TypeScript native

`mdat` exports definitions for rule types, and use of [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) allows configuration to be written in TypeScript.

### 6. Validation

In addition to content replacement, individual rules can define validation constraints. `mdat` includes a `--check` option which runs your expanded Markdown through a validator to enforce the presence and order of appearance of your comment placeholders.

### 7. Compound rules

It's easy to create "compound" expansion rules that encapsulate a number of other individual rules into a single Markdown comment to keep the quantity of template comments in check.

See the [`<!-- header -->`](./packages/mdat-readme/src/lib/rules/header.ts) rule in `mdat-readme` for an example.

### 8. Single-command readme workflow

`mdat`'s most typical use case is streamlined with the `mdat-readme` package. Invoking this CLI command in your repo will automatically find your readme and your package.json and provide access to a collection of bundled expansion rules.

It also provides an `init` subcommand with a selection of templates to kick off a fresh readme from scratch in a new project.

## Background

### Motivation

A package definition file like `package.json` is the canonical "single source of truth" for a project's metadata. Yet fragments of this metadata end up duplicated elsewhere, most prominently in the readme. Keeping them in sync is a pain.

You could set up a separate readme template file and use one of a to generate your readme, but then you'd still have to wire up data ingestion and deal with and the cognitive clutter of a second half-baked readme in your repo.

`mdat` solves this tedium by committing a minor sacrilege: It allows comments in Markdown files to become placeholders for dynamic content, overwriting themselves in place with content pulled from around your repo. When `mdat` is run against the file, specific comments are expanded with content from elsewhere, the file is updated in-situ.

I wrote it for use in my own projects, but if someone else finds it useful, that's great.

### Similar projects

This has been done several times before:

- Benjamin Lupton's [projectz](https://github.com/bevry/projectz)\
  Goes way back.

- David Wells' [Markdown Magic](https://github.com/DavidWells/markdown-magic)\
  I somehow missed the existence of this one until after building out `mdat`. It's very similar conceptually, and has a nice ecosystem of plugins.

- Titus Wormer's [mdast-zone](https://github.com/syntax-tree/mdast-zone)\
  Allows comments to be used as ranges or markers in Markdown files. Similar tree parsing and walking strategy to `mdat`. Mdast-zone uses different syntax for arguments, and requires both opening and closing tags to be present for expansion to occur.

- lillallol's [md-in-place](https://www.npmjs.com/package/md-in-place)

## Acknowledgments

- The [unified](https://unifiedjs.com), [remark](https://remark.js.org), and [unist](https://github.com/syntax-tree/unist) / [mdast](https://github.com/syntax-tree/mdast) ecosystem is powerful and well-architected. `mdat` relies on it to do the the heavy lifting in of parsing, transforming, and restoring the Markdown to string form.

- Richard Litt's [Standard Readme](https://github.com/RichardLitt/standard-readme) specification inspired some of the templates available in `mdat-readme`.

## The future

This project will remain under major [version zero](https://semver.org/#spec-item-4) until it's clear that the rule structures and so forth make sense. Breaking changes may be introduced with any point release until 1.0.

## Maintainers

[@kitschpatrol](https://github.com/kitschpatrol)

<!-- footer -->

## Contributing

[Issues](https://github.com/kitschpatrol/mdat/issues) and pull requests are welcome.

## License

[MIT](license.txt) © Eric Mika

<!-- /footer -->
