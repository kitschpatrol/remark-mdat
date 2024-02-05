import { execaCommand } from 'execa'
import { helpStringToCst } from './help-string-to-cst'
import { log } from 'remark-mdat'
import { ProgramInfo, helpCstToObject } from './help-cst-to-object'
import { helpObjectToMarkdown } from './help-object-to-markdown'

/**
 * Get help output from a CLI command and return it as markdown
 */
export async function getHelpMarkdown(cliCommand: string): Promise<string> {
	// Run the CLI help command
	const resolvedCommand = `${cliCommand} --help`

	let rawHelpString: string | undefined
	try {
		const { stdout, stderr } = await execaCommand(resolvedCommand)
		rawHelpString = stdout

		if (rawHelpString === undefined || rawHelpString === '') {
			rawHelpString = stderr
		}
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error running CLI help command: ${resolvedCommand}\n${error.message}\n`)
		}
	}

	if (rawHelpString === undefined || rawHelpString === '') {
		throw new Error(`No result from running CLI help command: ${resolvedCommand}\n`)
	}

	// Attempt to parse typical Yargs help output
	let programInfo: ProgramInfo | undefined
	try {
		const helpCst = helpStringToCst(rawHelpString)
		programInfo = helpCstToObject(helpCst)
	} catch (error) {
		if (error instanceof Error) {
			programInfo = undefined
			log.warn(`Error parsing help output for command: ${cliCommand}\n${error.message}`)
			log.warn(`Falling back to basic cli help text output.`)
		}
	}

	// Fall back to basic code fence output if parsing fails
	if (programInfo === undefined) {
		return renderHelpMarkdownBasic(rawHelpString)
	} else {
		// This might recurse back to getHelpMarkdown if there are subcommands
		return await renderHelpMarkdownYargs(cliCommand, programInfo)
	}
}

async function renderHelpMarkdownYargs(
	cliCommand: string,
	programInfo: ProgramInfo,
): Promise<string> {
	// If there are multiple commands, and a default command, then don't print all the options
	// for the default command, instead list the commands and their descriptions in their own section
	// when we call help recursively
	const commandsOnly =
		(programInfo.commands && programInfo.commands.some((c) => c.default)) ?? false

	let markdown = helpObjectToMarkdown(programInfo, commandsOnly)

	// check for subcommands
	if (programInfo.commands) {
		for (const command of programInfo.commands) {
			if (!command.name) continue
			const subCommandHelp = await getHelpMarkdown(`${cliCommand} ${command.name}`)
			markdown += `\n\n${subCommandHelp}`
		}
	}

	return markdown
}

async function renderHelpMarkdownBasic(rawHelpString: string): Promise<string> {
	return `\`\`\`sh\n${rawHelpString}\n\`\`\``
}