/* eslint-disable perfectionist/sort-objects */

// Staying basic, always log to stderr

import picocolors from 'picocolors'

// eslint-disable-next-line ts/no-unnecessary-condition
const isNode = process?.versions?.node !== undefined

const log = {
	verbose: false,

	// Intended for temporary logging
	log(...data: unknown[]): void {
		if (!this.verbose) return
		const levelPrefix = picocolors.gray('[Log]')
		if (isNode) {
			// Log to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.log(levelPrefix, ...data)
		}
	},
	logPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(picocolors.blue(`[${prefix}]`), ...data)
	},

	info(...data: unknown[]): void {
		if (!this.verbose) return
		const levelPrefix = picocolors.green('[Info]')
		if (isNode) {
			// Log info to stderr in node for ease of redirection
			console.warn(levelPrefix, ...data)
		} else {
			console.info(levelPrefix, ...data)
		}
	},
	infoPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(picocolors.blue(`[${prefix}]`), ...data)
	},

	warn(...data: unknown[]): void {
		console.warn(picocolors.yellow('[Warning]'), ...data)
	},
	warnPrefixed(prefix: string, ...data: unknown[]): void {
		this.warn(picocolors.blue(`[${prefix}]`), ...data)
	},

	error(...data: unknown[]): void {
		console.error(picocolors.red('[Error]'), ...data)
	},
	errorPrefixed(prefix: string, ...data: unknown[]): void {
		this.error(picocolors.blue(`[${prefix}]`), ...data)
	},
}

export default log
