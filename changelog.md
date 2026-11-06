# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [3.1.3] - 2026-11-01

### Documentation

- Correct the package-name example and remove the unreliable bundle-size badge.

### Maintenance

- Update lognow, tsdown, and shared configuration and remove the temporary eslint-mdx tslib workaround.
- Build before lint and fix commands and update the automated dependency-maintenance workflow.

## [3.1.2] - 2026-10-27

### Maintenance

- Refresh runtime and development dependencies and GitHub actions, add the eslint-mdx tslib workaround, and schedule dependency updates monthly.
- Replace prepare-script skill synchronization with pnpm-managed skill linking and workspace permissions.

## [3.1.1] - 2026-10-06

### Changed

- **Breaking:** Restrict supported Node.js versions to `^24.16.0 || >=26.3.0`.

### Documentation

- Refresh installation instructions and document the exact supported Node.js ranges.

### Maintenance

- Add scheduled dependency-update PR automation and synchronization of dependency-provided agent skills.
- Refresh test and lint dependencies, pnpm, and repository configuration.

## [3.1.0] - 2026-09-23

### Changed

- **Breaking:** Restrict comment keywords to identifier-like tokens containing letters, numbers, `_`, `$`, hyphens, and dots; preserve other comments during processing and stripping.

### Documentation

- Describe valid keyword characters and ordinary-comment handling.

## [3.0.3] - 2026-09-21

### Maintenance

- Update lognow, type-fest, and shared configuration and refresh pnpm dependency policies.

## [3.0.2] - 2026-09-17

### Documentation

- Add a bundle-size badge to the README.

### Maintenance

- Refresh runtime dependencies and GitHub actions and migrate contributor tooling to pnpm 12 and Vitest 5.
- Migrate benchmarks to Vitest 5 fixtures and update baseline comparison and reporting.

## [3.0.1] - 2026-08-05

### Documentation

- Replace redirecting npm and license links with their canonical URLs.

### Maintenance

- Refresh dependencies and repository tooling, simplify release validation, improve link checking, and add editor tasks.

## [3.0.0] - 2026-07-24

### Changed

- **Breaking:** Require Node.js 24.16.0 or newer.

### Documentation

- Update the documented Node.js requirement.

### Maintenance

- Refresh runtime and development dependencies, adopt TypeScript 6, add automated link checking, and update CI actions.

## [2.2.4] - 2026-06-11

### Maintenance

- Refresh dependencies and raise the contributor runtime requirement to Node.js 22.22.2.

## [2.2.3] - 2026-05-16

### Maintenance

- Migrate to pnpm 11 and its build-permission configuration, refresh dependencies and CI actions, and correct publishing-token assignment.

## [2.2.2] - 2026-04-30

### Documentation

- Update contribution guidance, tooling instructions, and license links.

### Maintenance

- Update Zod, shared configuration, tsdown, and pnpm.

## [2.2.1] - 2026-04-22

### Documentation

- Explain `mdatDiff` as the replacement for checking expansion freshness and correct migration examples and links.

### Maintenance

- Refresh dependencies, improve cross-platform cleanup scripts, and support release tags with or without a v prefix.

## [2.2.0] - 2026-04-03

### Added

- Export `mdatDiff` and `MdatDiffResult` to compare expansions by keyword, returning added, missing, stale, unexpanded, or up-to-date results and VFile diagnostics.

### Documentation

- Document per-placeholder comparison and checking workflows.

### Maintenance

- Add coverage tooling and expand parser, rule, reporting, diff, and benchmark tests.

## [2.1.0] - 2026-04-03

### Added

- Export `mdatCollapse` to collapse generated sections back to their original placeholders.
- Export `mdatStrip` to remove MDAT markers while preserving expanded content and code-style comments.

### Deprecated

- Deprecate `mdatClean` in favor of `mdatCollapse`, retaining it as an alias.

### Documentation

- Document collapse and strip utilities and their migration guidance.

### Maintenance

- Update shared configuration and extend tests and benchmarks for the new utilities.

## [2.0.2] - 2026-04-02

### Documentation

- Improve JSDoc for exported functions, rule types, options, and diagnostic reports.

## [2.0.1] - 2026-04-02

### Changed

- Reuse normalized rules and Markdown parsers and avoid unnecessary HTML splitting during expansion.

### Maintenance

- Add performance benchmarks and baselines, and refresh logging and lint dependencies.

## [2.0.0] - 2026-04-01

### Changed

- Move routine processing reports and success messages to debug logging while retaining warnings and errors.

### Documentation

- Correct migration-table formatting and expand its table of contents.

### Maintenance

- Run CI on Linux, macOS, and Windows, normalize line endings, and update shared configuration to fix Windows Knip failures.

## [2.0.0-preview.4] - 2026-04-01

### Changed

- **Breaking:** Restore the plugin's `Options` object with an optional `rules` field instead of accepting a `Rules` record directly.

### Documentation

- Add the 1.x-to-2.x migration guide and update installation, runtime, and API examples.

### Maintenance

- Update tsdown and Vitest dependencies.

## [2.0.0-preview.3] - 2026-04-01

### Changed

- Report failed compound sub-rules as warnings and preserve successful output; fail the expansion only when every sub-rule fails.

## [2.0.0-preview.2] - 2026-04-01

### Changed

- **Breaking:** Pass the exported `RuleContext` object containing `tree`, `filePath`, and parsed frontmatter as the second rule argument instead of the bare AST.
- Propagate compound sub-rule failures to the enclosing expansion instead of silently dropping them.
- **Breaking:** Require Node.js 20.19.6 or newer.

### Documentation

- Document rule context and frontmatter examples.

### Maintenance

- Build packages before preview publication and allow publishing from the preview branch.

## [2.0.0-preview.1] - 2026-03-31

### Added

- Ignore HTML comments beginning with code-style `//`, `#`, or `/*` prefixes.

### Changed

- **Breaking:** Require parenthesized function-call syntax for JSON5 comment arguments and support primitive values, dropping bare and space-separated argument parsing.
- **Breaking:** Rename `applicationOrder` to `order` for rule processing priority.
- **Breaking:** Accept a `Rules` record directly as plugin options and make `optionsSchema` validate that record.
- **Breaking:** Pass `Rules` directly to `mdat` and `mdatExpand`, remove utility option types, and remove the options argument from `mdatClean`.
- **Breaking:** Replace the exported `log` object with `setLogger` injection backed by lognow.
- **Breaking:** Reserve `/`, `*`, and `#` prefixes in rule keywords for comment syntax.
- **Breaking:** Raise the Node.js minimum from 20.0.0 to 20.19.0.

### Removed

- **Breaking:** Remove document-position validation and its former `order` metadata.
- **Breaking:** Remove required-placeholder validation, `required` metadata, and paranoid checks.
- **Breaking:** Remove `closingPrefix` customization; closing markers always use `/`.
- **Breaking:** Remove `keywordPrefix` configuration.
- **Breaking:** Remove generated meta comments and the `addMetaComment` and `metaCommentIdentifier` options.
- **Breaking:** Remove `mdatCheck` and report missing rules, empty output, and expansion errors during expansion.
- **Breaking:** Remove the `deepMergeDefined` export, moving that utility to mdat.

### Documentation

- Update examples and utility signatures for the simplified rules and argument syntax.

### Maintenance

- Upgrade schemas to Zod 4, add preview publishing scripts, and expand regression tests.

## [1.2.5] - 2026-03-31

### Documentation

- Add the CI status badge to the README.

### Maintenance

- Add CI builds, linting, and tests; refresh dependencies and GitHub workflow permissions and action pins.

## [1.2.4] - 2026-03-02

### Maintenance

- Publish unminified output and mark the package as side-effect-free.
- Update development dependencies and GitHub release and metadata actions.

## [1.2.3] - 2026-02-23

### Changed

- Relax the declared Node.js minimum from 20.19.0 to 20.0.0.
- **Breaking:** Restrict package subpath imports to the root export, with explicit JavaScript and declaration entry points.

### Fixed

- Eliminate circular references in the exported `Rule` type.
- Treat custom comment prefixes literally instead of interpreting them as regular expressions.
- Preserve correct source columns when splitting multiline HTML fragments.
- Compare compound sub-rules by their original content references during required and optional placeholder checks.
- Preserve underlying rule errors and include their causes in expansion diagnostics.
- Normalize report source paths and omit undefined destination paths.
- Reject empty `closingPrefix` values.

### Documentation

- Expand rule examples, option descriptions, and low-level utility signatures.

### Maintenance

- Externalize implementation dependencies and validate bundled declarations with tsdown, publint, and Are the Types Wrong.
- Expand tests for rule normalization, validation, helper functions, and multiline splitting.

## [1.2.2] - 2026-01-19

### Maintenance

- Refresh dependencies and editor configuration.

## [1.2.1] - 2025-12-08

### Maintenance

- Fix contributor dependency hoisting by moving pnpm settings into workspace configuration, and refresh dependencies.

## [1.2.0] - 2025-11-12

### Added

- Allow `addMetaComment` to be a string specifying a custom generated warning.

### Documentation

- Document custom warning strings in the plugin options.

### Maintenance

- Refresh Node.js types and build, test, and shared configuration dependencies.

## [1.1.3] - 2025-11-05

### Maintenance

- Update tsdown to 0.16, preserve .js output extensions, and refresh lint and test tooling.

## [1.1.2] - 2025-11-03

### Maintenance

- Refresh dependencies, adopt Vitest 4, and update token-based publishing configuration.

## [1.1.1] - 2025-09-29

### Maintenance

- Restore tsc-based declaration generation alongside tsdown JavaScript builds.

## [1.1.0] - 2025-09-29

### Changed

- **Breaking:** Require Node.js 20.19.0 or newer.

### Documentation

- Update the documented Node.js requirement.

### Maintenance

- Migrate builds from tsup to tsdown, switch lint commands to ksc, and refresh dependencies.

## [1.0.5] - 2025-09-01

### Maintenance

- Update dependencies and the repository metadata workflow, and move pnpm build permissions into workspace configuration.

## [1.0.4] - 2025-05-11

### Maintenance

- Replace Chalk with picocolors for diagnostic coloring.

## [1.0.3] - 2025-05-11

### Maintenance

- Refresh runtime dependencies and TypeScript, Vitest, build, and release tooling.

## [1.0.2] - 2025-03-04

### Changed

- Remove the pnpm engines requirement for package installation.

### Documentation

- Correct the package repository URL and Markdown input variables in README examples.

### Maintenance

- Update shared configuration and Node.js type dependencies.

## [1.0.1] - 2025-03-01

### Fixed

- Restore TypeScript declaration emission to dist for library consumers.

## [1.0.0] - 2025-03-01

### Maintenance

- Migrate contributor tooling to shared-config 5 and pnpm 10, adopt Vitest 3, and refresh dependencies.

## [0.7.5] - 2025-01-21

### Fixed

- Declare type-fest, unified, vfile, and zod as installed dependencies so consumers can resolve exported declaration types.

### Maintenance

- Refresh dependencies and rename the repository metadata workflow.

## [0.7.4] - 2024-11-07

### Maintenance

- Update bundled dependencies and build, test, and release tooling.

## [0.7.3] - 2024-09-14

### Maintenance

- Refresh TypeScript, Vitest, shared configuration, and release scripts.

## [0.7.2] - 2024-09-07

### Maintenance

- Update dependencies, including shared lint configuration, HTML parsing, and VFile packages.

## [0.7.1] - 2024-08-14

### Changed

- **Breaking:** Require Node.js `^18.19.0 || >=20.5.0`.

### Documentation

- Correct README examples and document the precise Node.js requirement.

### Maintenance

- Refresh bundled dependencies and development tooling, adopt Vitest 2, and update GitHub workflows.

## [0.7.0] - 2024-06-07

### Changed

- **Breaking:** Raise remark-mdat's minimum Node.js version from 16 to 18.

### Documentation

- Replace the monorepo overview with a standalone remark-mdat guide and links to the separate mdat project.

### Maintenance

- Split the monorepo, move remark-mdat to the repository root, and move mdat into its own repository.

## [0.6.16] - 2024-06-07

### Maintenance

- Update the GitHub release action and explicitly build packages before publishing.

## [0.6.15] - 2024-06-04

### Fixed

- Emit mdat library declarations at the expected distribution paths by separating library and CLI build configurations.

## [0.6.14] - 2024-06-04

### Maintenance

- Bundle implementation dependencies while retaining external type dependencies, and adjust declaration build scopes.

## [0.6.13] - 2024-06-04

### Added

- Add `cli` as an alias for the cli-help README rule.

### Fixed

- Report the correct package version from `mdat --version`.
- Install declaration dependencies with the packages by moving required type packages into dependencies.

### Documentation

- Correct the `cliCommand` option spelling in the command-inference error example.

### Maintenance

- Refresh dependencies, including deepmerge-ts 7, and improve CLI-help tests.

## [0.6.12] - 2024-05-19

### Fixed

- Resolve ESM imports in TypeScript configuration files, avoiding Chevrotain's no-exports-main-defined error.

### Maintenance

- Target Node 18 in package builds.

## [0.6.11] - 2024-05-19

### Fixed

- Load TypeScript configuration and rule files that import modules through filesystem paths.

## [0.6.10] - 2024-05-19

### Documentation

- Link directly to package README files from the project overview.

### Maintenance

- Refresh dependencies, including Execa 9 and deepmerge-ts 6, and update test and release tooling.

## [0.6.9] - 2024-04-26

### Documentation

- Document Yargs and Meow help support, raw-output fallback, and the related jc parsing project.

### Maintenance

- Update runtime dependencies and TypeScript, Vitest, release, and package-manager tooling.

## [0.6.8] - 2024-03-17

### Changed

- Broaden banner discovery to common asset locations, including `.github/assets` and splash filenames, while limiting search depth.

### Maintenance

- Refresh runtime and development dependencies and pin the repository's pnpm version.

## [0.6.7] - 2024-02-29

### Maintenance

- Add repository metadata synchronization and update release workflow actions and shared configuration.

## [0.6.6] - 2024-02-29

### Added

- Add `description` as an alias for the short-description README rule.

### Changed

- **Breaking:** Rename the built-in template choice from `Mdat Readme` to `MDAT Readme`.

### Fixed

- Pass comment options correctly through the toc alias.

### Documentation

- Clarify README rule aliases and standardize MDAT terminology.

### Maintenance

- Refresh development dependencies and expand description and table-of-contents rule tests.

## [0.6.5] - 2024-02-24

### Changed

- Make all bundled README rules optional during validation.

## [0.6.4] - 2024-02-23

### Maintenance

- Update tldraw-cli and development dependencies, and simplify spelling and Markdown lint configuration.

## [0.6.3] - 2024-02-23

### Changed

- Remove generation dates from optional meta comments so repeated expansion does not introduce date-only changes.

### Documentation

- Update `--meta` help text for the dateless generation warning.

## [0.6.2] - 2024-02-22

### Fixed

- Include top-level options in generated CLI documentation when no default subcommand exists.

## [0.6.1] - 2024-02-22

### Fixed

- Avoid undefined default-command notices in generated CLI help.

### Maintenance

- Correct the Vitest option disabling parallel test files.

## [0.6.0] - 2024-02-22

### Added

- Allow remote URLs as banner sources.
- Generate badges for additional npm packages through the badges rule's `npm` option.

### Changed

- **Breaking:** Rename the table-of-contents rule's `maxDepth` option to `depth`.

### Fixed

- Correct duplicated subcommand names in generated CLI help and allow omitted cli-help options.
- Restore remote tldraw URL loading by updating `@kitschpatrol/tldraw-cli`.
- Correct expansion and saving of newly initialized README files.

### Documentation

- Update README workflow instructions, configuration examples, and generated CLI documentation.

### Maintenance

- Refresh runtime dependencies, build/test tools, and repository lint configuration.

## [0.5.2] - 2024-02-10

### Changed

- **Breaking:** Restrict `mergeConfigs` to two `Config` arguments and a `Config` return type.

## [0.5.1] - 2024-02-10

### Added

- Export `mergeConfigs` for deep-merging configuration objects with later values taking precedence.

### Documentation

- Document the `mergeConfigs` library helper.

## [0.5.0] - 2024-02-10

### Added

- Parse Meow CLI help in addition to Yargs help.
- Add cli-help options to customize `helpFlag` and limit recursive subcommand documentation with `depth`.

### Documentation

- Add a custom-rule example to the project overview.

## [0.4.0] - 2024-02-09

### Added

- Export `checkFiles`, `checkString`, `checkReadmeFiles`, and `checkReadmeString` for validation without expansion.

### Changed

- **Breaking:** Rename clean CLI commands and mdat library operations to collapse.
- **Breaking:** Replace `--readme` and `readmeFile` configuration with optional positional README paths, supporting multiple files and corresponding `*ReadmeFiles` APIs.
- **Breaking:** Replace `expandFile` with `expandFiles`, accepting a single path or an array and returning `VFile[]`.
- Resolve generated tldraw image links relative to the package directory.

### Fixed

- Make check commands validate the existing document instead of re-expanding it before validation.

### Documentation

- Update CLI and API examples for positional files and collapse commands.

## [0.3.2] - 2024-02-08

### Documentation

- Remove the obsolete mdat-readme label from the workflow diagram and clarify the tldraw reference.

## [0.3.1] - 2024-02-08

### Documentation

- Fix the overview's Markdown code fence and clarify mdat's README presets.

## [0.3.0] - 2024-02-08

### Changed

- **Breaking:** Move mdat-readme into mdat, replacing its standalone package and executable with `mdat readme` subcommands and README APIs exported by mdat.
- **Breaking:** Replace the `--check` flag with dedicated `mdat check` and `mdat readme check` subcommands.
- **Breaking:** Replace expansion-specific configuration aliases with `Config` and simplify `loadConfig` to return resolved configuration without custom schema extensions.
- **Breaking:** Return VFile directly from README expansion APIs instead of wrapper reports, and rename the file operations to `expandReadme` and `cleanReadme`.

### Fixed

- Make `mdat clean` save collapsed files or print them when `--print` is requested.
- Improve parsing and rendering of CLI help for nested subcommands.

### Documentation

- Rewrite installation, CLI, API, and package-navigation guidance for the consolidated two-package layout.

## [0.2.0] - 2024-02-08

### Added

- Add clean commands and library APIs to collapse expanded comments back to placeholders in Markdown and README files.

### Maintenance

- Update Node.js type declarations across the packages.

## [0.1.1] - 2024-02-07

### Fixed

- Detect the package directory during README initialization even when no README exists.

## [0.1.0] - 2024-02-07

### Added

- Introduce a typed ESM remark plugin for Node 16+ that expands HTML comment placeholders, adds closing markers, and regenerates existing expansions.
- Support string, synchronous, asynchronous, and compound rules with JSON5 comment arguments, document-tree access, and configurable processing priority.
- Validate required placeholders, document order, rule output, prefixes, and generated warning comments through VFile diagnostics.
- Export AST utilities for splitting, collapsing, expanding, and checking comments, plus rule types, schemas, reporting helpers, and configuration-merging utilities.
- Provide the Node 18+ mdat CLI with multiple-file expansion, in-place or redirected output, check mode, custom rules, prefixes, and optional generation warnings.
- Expose string and file expansion APIs returning VFiles, leaving saving to the caller.
- Discover and merge configuration and rule files, including TypeScript, JavaScript, YAML, and JSON; expose nested JSON values as dot-separated rule keywords.
- Provide mdat-readme APIs and CLI commands that discover package metadata and generate titles, banners, badges, descriptions, tables of contents, code snippets, contributing sections, and licenses.
- Create README files interactively or without prompts using MDAT and Standard Readme templates, with compound placeholders and optional immediate expansion.
- Generate Markdown documentation from Yargs CLI help, recursively documenting subcommands and falling back to raw help when parsing fails.
- Embed local or remote tldraw sketches as light/dark SVG assets, with hashed filenames, local-source caching, and stale-asset cleanup.

### Documentation

- Add installation guides, CLI and library examples, configuration guidance, rule references, and workflow diagrams.

### Maintenance

- Establish package builds, TypeScript declarations, linting, Vitest tests, and automated release tooling.

[0.1.0]: https://github.com/kitschpatrol/remark-mdat/releases/tag/v0.1.0
[0.1.1]: https://github.com/kitschpatrol/remark-mdat/compare/v0.1.0...v0.1.1
[0.2.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.1.1...v0.2.0
[0.3.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.2.0...v0.3.0
[0.3.1]: https://github.com/kitschpatrol/remark-mdat/compare/v0.3.0...v0.3.1
[0.3.2]: https://github.com/kitschpatrol/remark-mdat/compare/v0.3.1...v0.3.2
[0.4.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.3.2...v0.4.0
[0.5.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.4.0...v0.5.0
[0.5.1]: https://github.com/kitschpatrol/remark-mdat/compare/v0.5.0...v0.5.1
[0.5.2]: https://github.com/kitschpatrol/remark-mdat/compare/v0.5.1...v0.5.2
[0.6.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.5.2...v0.6.0
[0.6.1]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.0...v0.6.1
[0.6.2]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.1...v0.6.2
[0.6.3]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.2...v0.6.3
[0.6.4]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.3...v0.6.4
[0.6.5]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.4...v0.6.5
[0.6.6]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.5...v0.6.6
[0.6.7]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.6...v0.6.7
[0.6.8]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.7...v0.6.8
[0.6.9]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.8...v0.6.9
[0.6.10]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.9...v0.6.10
[0.6.11]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.10...v0.6.11
[0.6.12]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.11...v0.6.12
[0.6.13]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.12...v0.6.13
[0.6.14]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.13...v0.6.14
[0.6.15]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.14...v0.6.15
[0.6.16]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.15...v0.6.16
[0.7.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.6.16...v0.7.0
[0.7.1]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.0...v0.7.1
[0.7.2]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.1...v0.7.2
[0.7.3]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.2...v0.7.3
[0.7.4]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.3...v0.7.4
[0.7.5]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.4...v0.7.5
[1.0.0]: https://github.com/kitschpatrol/remark-mdat/compare/v0.7.5...v1.0.0
[1.0.1]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.4...v1.0.5
[1.1.0]: https://github.com/kitschpatrol/remark-mdat/compare/v1.0.5...v1.1.0
[1.1.1]: https://github.com/kitschpatrol/remark-mdat/compare/v1.1.0...v1.1.1
[1.1.2]: https://github.com/kitschpatrol/remark-mdat/compare/v1.1.1...v1.1.2
[1.1.3]: https://github.com/kitschpatrol/remark-mdat/compare/v1.1.2...v1.1.3
[1.2.0]: https://github.com/kitschpatrol/remark-mdat/compare/v1.1.3...v1.2.0
[1.2.1]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.0...v1.2.1
[1.2.2]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.1...v1.2.2
[1.2.3]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.2...v1.2.3
[1.2.4]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.3...v1.2.4
[1.2.5]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.4...v1.2.5
[2.0.0-preview.1]: https://github.com/kitschpatrol/remark-mdat/compare/v1.2.5...v2.0.0-preview.1
[2.0.0-preview.2]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.0-preview.1...v2.0.0-preview.2
[2.0.0-preview.3]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.0-preview.2...v2.0.0-preview.3
[2.0.0-preview.4]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.0-preview.3...v2.0.0-preview.4
[2.0.0]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.0-preview.4...v2.0.0
[2.0.1]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.0...v2.0.1
[2.0.2]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.1...v2.0.2
[2.1.0]: https://github.com/kitschpatrol/remark-mdat/compare/v2.0.2...v2.1.0
[2.2.0]: https://github.com/kitschpatrol/remark-mdat/compare/v2.1.0...v2.2.0
[2.2.1]: https://github.com/kitschpatrol/remark-mdat/compare/v2.2.0...v2.2.1
[2.2.2]: https://github.com/kitschpatrol/remark-mdat/compare/v2.2.1...v2.2.2
[2.2.3]: https://github.com/kitschpatrol/remark-mdat/compare/v2.2.2...v2.2.3
[2.2.4]: https://github.com/kitschpatrol/remark-mdat/compare/v2.2.3...v2.2.4
[3.0.0]: https://github.com/kitschpatrol/remark-mdat/compare/v2.2.4...v3.0.0
[3.0.1]: https://github.com/kitschpatrol/remark-mdat/compare/v3.0.0...v3.0.1
[3.0.2]: https://github.com/kitschpatrol/remark-mdat/compare/v3.0.1...v3.0.2
[3.0.3]: https://github.com/kitschpatrol/remark-mdat/compare/v3.0.2...v3.0.3
[3.1.0]: https://github.com/kitschpatrol/remark-mdat/compare/v3.0.3...v3.1.0
[3.1.1]: https://github.com/kitschpatrol/remark-mdat/compare/v3.1.0...v3.1.1
[3.1.2]: https://github.com/kitschpatrol/remark-mdat/compare/v3.1.1...v3.1.2
[3.1.3]: https://github.com/kitschpatrol/remark-mdat/compare/v3.1.2...v3.1.3
