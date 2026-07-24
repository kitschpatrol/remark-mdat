/* eslint-disable ts/no-unnecessary-condition */

import type { Node } from 'unist'
import type { VFile } from 'vfile'
import type { Options, VFileMessage } from 'vfile-message'
import path from 'node:path'
import picocolors from 'picocolors'
import { log } from './log'

/** A simplified representation of a {@link VFileMessage}. */
export type MdatMessage = {
	/** Starting column of the message origin. */
	column?: number
	/** Severity level. */
	level: 'error' | 'info' | 'warn'
	/** Starting line of the message origin. */
	line?: number
	/** Human-readable description of the issue. */
	message: string
	/** Namespace that produced the message (e.g. the rule name). */
	source?: string
}

/** Aggregated processing report for a single file. */
export type MdatFileReport = {
	/** Output path if the file was written to a different location. */
	destinationPath?: string
	/** Fatal errors that prevented successful processing. */
	errors: MdatMessage[]
	/** Informational messages. */
	infos: MdatMessage[]
	/** Original input file path. */
	sourcePath: string
	/** Non-fatal warnings encountered during processing. */
	warnings: MdatMessage[]
}

// Official fields:
// ancestors (Array<Node> or undefined) — stack of (inclusive) ancestor nodes surrounding the message
// cause (Error or undefined) — original error cause of the message
// column (number or undefined) — starting column of message
// fatal (boolean or undefined) — state of problem; true: error, file not usable; false: warning, change may be needed; undefined: info, change likely not needed
// line (number or undefined) — starting line of message
// place (Point, Position or undefined) — place of message
// reason (string) — reason for message (should use Markdown)
// ruleId (string or undefined, example: 'my-rule') — category of message
// source (string or undefined, example: 'my-package') — namespace of message

/**
 * Records a diagnostic message on a VFile at the given location. Accepts either
 * explicit line/column numbers or a unist Node for position.
 */
export function saveLog(
	file: VFile,
	level: 'error' | 'info' | 'warn',
	source: string,
	message: string,
	line?: number,
	column?: number,
): void
export function saveLog(
	file: VFile,
	level: 'error' | 'info' | 'warn',
	source: string,
	message: string,
	node?: Node,
): void
export function saveLog(
	file: VFile,
	level: 'error' | 'info' | 'warn',
	source: string,
	message: string,
	lineOrNode?: Node | number,
	maybeColumn?: number,
): void {
	let line: number
	let column: number

	if (lineOrNode === undefined || typeof lineOrNode === 'number') {
		// Handle the case where lineOrNode is a number
		// Defensive: nullish defines, and both overloads tested
		line = lineOrNode ?? 0
		column = maybeColumn ?? 0 // Use the provided column or default to 0
	} else {
		// Handle the case where lineOrNode is a Node
		// defensive: nodes from parser always have positions
		line = lineOrNode?.position?.start.line ?? 0
		column = lineOrNode?.position?.start.column ?? 0
	}

	const options: Options = {
		place: {
			start: {
				column,
				line,
			},
			end: {
				column,
				line,
			},
		},
		source,
	}

	const vFileMessage = file.message(message, options)
	vFileMessage.fatal = level === 'error' ? true : level === 'warn' ? false : undefined
}

function vFileMessageToMdatMessage(vFileMessage: VFileMessage): MdatMessage {
	return {
		column: vFileMessage.column,
		level: vFileMessage.fatal ? 'error' : vFileMessage.fatal === false ? 'warn' : 'info',
		line: vFileMessage.line,
		message: vFileMessage.reason,
		source: vFileMessage.source,
	}
}

/** Converts an array of processed VFiles into {@link MdatFileReport} objects. */
export function getMdatReports(files: VFile[]): MdatFileReport[] {
	return files.map((file) => getMdatReport(file))
}

function getMdatReport(file: VFile): MdatFileReport {
	const mdatFileReport: MdatFileReport = {
		destinationPath: file.history.length > 0 ? file.history.at(-1) : undefined,
		errors: [],
		infos: [],
		sourcePath: file.history.at(0) ?? file.path,
		warnings: [],
	}

	if (mdatFileReport.sourcePath !== undefined) {
		mdatFileReport.sourcePath = path.normalize(mdatFileReport.sourcePath)
	}

	for (const message of file.messages) {
		const mdatMessage = vFileMessageToMdatMessage(message)
		if (mdatMessage.level === 'error') {
			mdatFileReport.errors.push(mdatMessage)
		} else if (mdatMessage.level === 'warn') {
			mdatFileReport.warnings.push(mdatMessage)
		} else {
			mdatFileReport.infos.push(mdatMessage)
		}
	}

	return mdatFileReport
}

/** Logs a human-readable processing report for each VFile to the library logger. */
export function reporterMdat(files: VFile[]): void {
	for (const file of files) {
		const mdatFileReport = getMdatReport(file)
		const { destinationPath, errors, infos, sourcePath, warnings } = mdatFileReport

		log.debug(picocolors.bold('MDAT Report:'))
		log.debug(`\tFrom: ${picocolors.blue(picocolors.bold(sourcePath))}`)
		if (destinationPath !== undefined) {
			log.debug(`\tTo:   ${picocolors.blue(picocolors.bold(destinationPath))}`)
		}

		for (const message of errors) {
			log.error(mdatMessageToLogString(sourcePath, message))
		}

		for (const message of warnings) {
			log.warn(mdatMessageToLogString(sourcePath, message))
		}

		for (const message of infos) {
			log.debug(mdatMessageToLogString(sourcePath, message))
		}

		if (errors.length === 0 && warnings.length === 0) {
			log.debug(`No issues found in ${sourcePath}`)
		} else {
			log.error(`${errors.length} errors, ${warnings.length} warnings found in ${sourcePath}`)
		}
	}
}

function mdatMessageToLogString(sourcePath: string, mdatMessage: MdatMessage): string {
	const { column, level, line, message, source } = mdatMessage

	const resolvedSource =
		source !== undefined && source !== '' ? picocolors.gray(`[${source}] `) : ''
	const hasPlace = line !== undefined && line !== 0 && column !== undefined && column !== 0
	const lineColumn = hasPlace ? `:${line}:${column}` : ''

	const highlightedMessage = highlightComments(message, level)

	return `${resolvedSource}${highlightedMessage} ${picocolors.whiteBright(sourcePath + lineColumn)}`
}

function highlightComments(text: string, level: 'error' | 'info' | 'warn'): string {
	return text.replaceAll(/<!--.+-->/gv, (match) =>
		level === 'info'
			? picocolors.green(match)
			: level === 'warn'
				? picocolors.yellow(match)
				: picocolors.red(match),
	)
}
