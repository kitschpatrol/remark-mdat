#!/usr/bin/env node

import { expandFiles } from '../lib/api'
import { type Config, loadConfig } from '../lib/config'
import logSymbols from 'log-symbols'
import plur from 'plur'
import prettyMilliseconds from 'pretty-ms'
import { getMdatReports, log, reporterMdat } from 'remark-mdat'
import { write } from 'to-vfile'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const startTime = performance.now()

try {
	await yargs(hideBin(process.argv))
		.scriptName('mdat')
		.command(
			['$0 <files..>', 'expand <files..>'],
			'description goes here',
			(yargs) =>
				yargs
					.positional('files', {
						array: true,
						demandOption: true,
						describe: 'TODO',
						type: 'string',
					})
					.option('rules', {
						alias: 'r',
						demandOption: true,
						description: 'Path(s) to .js ES module files containing expansion rules.',
						string: true,
						type: 'array',
					})
					.option('output', {
						alias: 'o',
						defaultDescription: 'Same directory as input file.',
						description: 'Output file directory.',
						type: 'string',
					})
					.option('name', {
						alias: 'n',
						defaultDescription: 'Same name as input file. Overwrites the input file.',
						description: 'Output file name.',
						type: 'string',
					})
					.option('print', {
						default: false,
						description:
							'Print the expanded markdown to stdout instead of saving to a file. Ignores `--output` and `--name` options.',
						type: 'boolean',
					})
					.option('prefix', {
						description:
							"Require a string prefix before all comments to be considered for expansion. Useful if you have a bunch of non-mdat comments in your markdown file, or if you're willing to trade some verbosity for safety.",
						type: 'string',
					})
					.option('meta', {
						alias: 'm',
						default: false,
						description:
							'Embed an extra comment at the top of the generated markdown noting the date of generation and warning editors that certain sections of the document have been generated dynamically.',
						type: 'boolean',
					})
					.option('check', {
						alias: 'c',
						default: false,
						describe:
							'Check the input files for rule violations without expanding them. Identifies things like missing comment placeholders and incorrect placeholder ordering.',
						type: 'boolean',
					})
					.option('verbose', {
						default: false,
						describe:
							'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
						type: 'boolean',
					}),
			async ({ check, files, meta, name, output, prefix = '', print, rules, verbose }) => {
				log.verbose = verbose

				if (check) {
					// Validate the file, don't write anything
					if (output) {
						output = undefined
						log.warn(`${logSymbols.warning} Ignoring --output option because --check is set`)
					}

					if (name) {
						name = undefined
						log.warn(`${logSymbols.warning} Ignoring --name option because --check is set`)
					}

					if (print) {
						print = false
						log.warn(`${logSymbols.warning} Ignoring --print option because --check is set`)
					}
				}

				if (print) {
					if (output) {
						output = undefined
						log.warn(`${logSymbols.warning} Ignoring --output option because --print is set`)
					}

					if (name) {
						name = undefined
						log.warnPrefixed(
							'expand',
							`${logSymbols.warning} Ignoring --name option because --print is set`,
						)
					}
				}

				// CLI options override any config file options
				const cliConfig: Config = {
					addMetaComment: meta,
					keywordPrefix: prefix,
					rules: {}, // Needed for config type detection...
				}

				const results = await expandFiles(files, name, output, [...rules, cliConfig])

				// Log to stdout if requested
				if (print) {
					for (const file of results) {
						process.stdout.write(file.toString())
					}
				}

				// Log the results, goes through log not console
				// to respect verbosity
				reporterMdat(results)

				// Save files to disk
				if (!check && !print) {
					for (const file of results) {
						await write(file)
					}
				}

				// Errors determine exit code
				const reports = getMdatReports(results)
				const errorCount = reports.reduce((count, report) => count + report.errors.length, 0)

				log.info(
					`Expanded comments in ${files.length} ${plur('file', files.length)} in ${prettyMilliseconds(performance.now() - startTime)}.`,
				)
				process.exitCode = errorCount > 0 ? 1 : 0
			},
		)
		.help()
		.alias('h', 'help')
		.version()
		.alias('v', 'version')
		.fail(false)
		.parse()
} catch (error) {
	if (error instanceof Error) {
		log.error(error.message)
	}

	process.exit(1)
}
