#!/usr/bin/env node

import log from '../lib/log'
import { expandCommand } from './commands/expand'
import { readmeCommand } from './commands/readme'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// TODO make lint its own command
// .option('lint', {
// 	description:
// 		'Validate the file against any expansion rules in `--preset` and / or `--rules`. Ignores `--output`, `--name`,`--meta`',
// 	type: 'boolean',
// })

try {
	await yargs(hideBin(process.argv))
		.scriptName('markex')
		// Common options
		.option('verbose', {
			default: false,
			describe:
				'Enable verbose logging. All verbose logs and prefixed with their log level and are printed to `stderr` for ease of redirection.',
			type: 'boolean',
		})
		.option('print', {
			default: false,
			description:
				'Print the expanded markdown to stdout instead of saving to a file. Ignores `--output` and `--name` options.',
			type: 'boolean',
		})
		.option('prefix', {
			default: '',
			description:
				"Require a string prefix before all comments to be considered for expansion. Useful if you have a bunch of non-markex comments in your markdown file, or if you're willing to trade some verbosity for safety.",
			type: 'string',
		})
		.option('meta', {
			alias: 'm',
			default: false,
			description:
				'Embed an extra comment at the top of the generated markdown noting the date of generation and warning editors that certain sections of the document have been generated dynamically.',
			type: 'boolean',
		})
		.command(
			'readme',
			'description goes here',
			(yargs) => yargs,
			async ({ verbose, ...rest }) => {
				log.verbose = verbose
				await readmeCommand(rest)
			},
		)
		.command(
			['$0 <files..>', 'expand <files..>'],
			'description goes here',
			(yargs) =>
				yargs
					.positional('files', {
						demandOption: true,
						describe: 'TODO',
						type: 'string',
					})
					.option('preset', {
						choices: ['readme'] as const,
						description:
							'Presets are collections of convenient rule included with markex. Currently, `readme` is the only bundled preset. Presets are also available as top-level commands on `markex` with some additional functionality, e.g. `markex readme` applies `--preset readme` and also finds the nearest readme file.',
						requiresArg: true,
						type: 'string',
					})
					.option('rules', {
						alias: 'r',
						description: 'Path to .js or .ts files with expansion rules.',
						string: true, // Ensures the array items are treated as strings
						type: 'array',
					})
					.option('output', {
						alias: 'o',
						description: 'Output file directory.',
						type: 'string',
					})
					.option('name', {
						alias: 'n',
						description: 'Output file name.',
						type: 'string',
					}),
			async ({ verbose, ...rest }) => {
				log.verbose = verbose
				await expandCommand(rest)
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
