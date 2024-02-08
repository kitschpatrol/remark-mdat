#!/usr/bin/env node

import { type ExpandReadmeConfig, expandReadmeFile } from '../lib/api'
import { initReadme, initReadmeInteractive } from '../lib/init'
import templates from '../lib/templates'
import chalk from 'chalk'
import prettyMilliseconds from 'pretty-ms'
import { getMdatReports, log, reporterMdat } from 'remark-mdat'
import { write } from 'to-vfile'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const startTime = performance.now()
const yargsInstance = yargs(hideBin(process.argv))

try {
	await yargsInstance
		.scriptName('mdat-readme')
		.usage('$0 [command] [options]', 'Use the `mdat` comment expansion system with your readme.md.')
		.command(
			['$0 [options]', 'expand [options]'],
			'Expand `mdat` comment placeholders in your readme.md using a collection of helpful built-in expansion rules.',
			(yargs) =>
				yargs
					.option('readme', {
						defaultDescription: 'The closest readme.md file is used by default.',
						description: 'Path to the readme.md file to expand.',
						type: 'string',
					})
					.option('package', {
						defaultDescription: 'The closest package.json file is used by default.',
						description: 'Path to the package.json file to use to populate the readme.',
						string: true,
					})
					.option('assets', {
						defaultDescription: './assets',
						description: 'Path to find and save readme-related assets.',
						string: true,
					})
					.option('config', {
						defaultDescription:
							'Configuration is automatically loaded if found from the usual places, otherwise sensible defaults are used.',
						description: 'Path(s) to files containing mdat configs.',
						string: true,
						type: 'array',
					})
					.option('rules', {
						alias: 'r',
						description: 'Path(s) to files containing additional mdat comment expansion rules.',
						string: true,
						type: 'array',
					})
					.option('output', {
						alias: 'o',
						defaultDescription: 'Same directory as your readme file.',
						description: 'Output file directory.',
						type: 'string',
					})
					.option('name', {
						alias: 'n',
						defaultDescription:
							'Same directory as input file. Writes directly to your readme file.',
						description: 'Output file name.',
						type: 'string',
					})
					.option('print', {
						default: false,
						description:
							'Print the expanded Markdown to stdout instead of saving to a file. Ignores `--output` and `--name` options.',
						type: 'boolean',
					})
					.option('prefix', {
						description:
							"Require a string prefix before all comments to be considered for expansion. Useful if you have a bunch of non-`mdat` comments in your Markdown file, or if you're willing to trade some verbosity for safety.",
						type: 'string',
					})
					.option('meta', {
						alias: 'm',
						default: true,
						description:
							'Embed an extra comment at the top of the generated Markdown noting the date of generation and warning editors that certain sections of the document have been generated dynamically.',
						type: 'boolean',
					})
					.option('check', {
						alias: 'c',
						default: false,
						describe:
							'Check your readme for rule violations without expanding comments. Identifies things like missing comment placeholders and incorrect placeholder ordering.',
						type: 'boolean',
					})
					.option('verbose', {
						default: false,
						describe:
							'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to stderr for ease of redirection.',
						type: 'boolean',
					}),
			async ({
				assets: assetsPath,
				check,
				config,
				meta: addMetaComment,
				name,
				output,
				package: packageFile,
				prefix: keywordPrefix,
				print,
				readme: readmeFile,
				rules = [],
				verbose,
			}) => {
				log.verbose = verbose

				if (check) {
					// Check the file, don't write anything
					if (output) {
						output = undefined
						log.warn(`Ignoring --output option because --check is set`)
					}

					if (name) {
						name = undefined
						log.warn(`Ignoring --name option because --check is set`)
					}

					if (print) {
						print = false
						log.warn(`Ignoring --print option because --check is set`)
					}
				}

				if (print) {
					if (output) {
						output = undefined
						log.warn(`Ignoring --output option because --print is set`)
					}

					if (name) {
						name = undefined
						log.warn(`Ignoring --name option because --print is set`)
					}
				}

				log.info(
					`${check ? 'Checking' : 'Expanding'} mdat comments in readme at "${readmeFile}"...`,
				)

				// CLI options override any loaded or passed config options
				const cliConfig: ExpandReadmeConfig = [
					...(config ?? []),
					{
						addMetaComment,
						assetsPath,
						keywordPrefix,
						packageFile,
						readmeFile,
					},
				]

				const results = await expandReadmeFile(cliConfig, rules)

				// Log to stdout if requested
				if (print) {
					process.stdout.write(results.result.toString())
				}

				log.info(`Expanding comment in readme:   ${chalk.bold.blue(results.readmeFile)}`)
				log.info(`Pulling package metadata from: ${chalk.bold.blue(results.packageFile)}`)

				// Log the result, goes through log not console
				// to respect verbosity
				reporterMdat([results.result])

				// Save file to disk
				if (!check && !print) {
					await write(results.result)
				}

				// Errors determine exit code
				const reports = getMdatReports([results.result])
				const errorCount = reports.reduce((count, report) => count + report.errors.length, 0)

				log.info(
					`Expanded readme comments in ${prettyMilliseconds(performance.now() - startTime)}.`,
				)
				process.exitCode = errorCount > 0 ? 1 : 0
			},
		)
		.command(
			'init [options]',
			'Interactively Create a new readme.md file with sensible `mdat` comment placeholders.',
			(yargs) =>
				yargs
					.option('interactive', {
						alias: 'i',
						default: true,
						description:
							'Run the guided interactive `init` process. Set explicitly to `false` to use default values and skip the prompt.',
						type: 'boolean',
					})
					.option('overwrite', {
						default: false,
						defaultDescription: "`false`, if an existing readme is found, don't touch it.",
						description: 'Replace an existing readme file if one is found.',
						type: 'boolean',
					})
					.option('output', {
						alias: 'o',
						defaultDescription:
							"The package root if you're in a package, otherwise the current working directory.",
						description: 'Destination directory for the new readme file.',
						type: 'string',
					})
					.option('expand', {
						alias: 'e',
						default: true,
						description:
							'Automatically run `mdat-readme` immediately after creating the readme template.',
						type: 'boolean',
					})
					.option('template', {
						alias: 't',
						choices: Object.keys(templates),
						default: Object.keys(templates)[0],
						description: 'Specify a template to use for the new readme.',
						type: 'string',
					})
					.option('compound', {
						alias: 'c',
						default: true,
						description:
							"Use compound comment version of the template to replace several individual comment placeholders where possible. This combines things like `<!-- title -->`, `<!-- badges -->`, etc. in a single `<!-- header -->` comment. It's less clutter when you're editing, but it's also less explicit. The final readme.md output is identical.",
						type: 'boolean',
					})
					.option('verbose', {
						default: false,
						describe:
							'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to stderr for ease of redirection.',
						type: 'boolean',
					}),
			async ({ compound, expand, interactive, output, overwrite, template, verbose }) => {
				log.verbose = verbose

				if (interactive) {
					await initReadmeInteractive()
				} else {
					const readmePath = await initReadme({ compound, expand, output, overwrite, template })
					log.info(
						`Created readme at "${chalk.blue(readmePath)}" in ${prettyMilliseconds(performance.now() - startTime)}.`,
					)
				}

				process.exitCode = 0
			},
		)
		.help()
		.alias('h', 'help')
		.version()
		.alias('v', 'version')
		// Some maneuvering to get full-width help output via non-ttys for parsing
		.wrap(process.stdout.isTTY ? Math.min(120, yargsInstance.terminalWidth()) : 0)
		.fail(false)
		.parse()
} catch (error) {
	if (error instanceof Error) {
		log.error(error.message)
	}

	process.exitCode = 1
}
