import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import type { MdatFileReport, Rules } from '../src'
import remarkMdat, {
	getMdatReports,
	mdatClean,
	mdatCollapse,
	mdatDiff,
	mdatExpand,
	mdatSplit,
	mdatStrip,
	reporterMdat,
	setLogger,
} from '../src'

async function expandToVfile(markdown: string, rules: Rules) {
	return remark().use(remarkGfm).use(remarkMdat, { rules }).process(markdown)
}

describe('getMdatReports', () => {
	it('should produce reports with errors, warnings, and infos', async () => {
		const rules: Rules = { keyword: 'expanded' }
		const markdown = `<!-- keyword -->\n<!-- mystery -->\n`
		const result = await expandToVfile(markdown, rules)
		const reports = getMdatReports([result])
		expect(reports).toHaveLength(1)
		const report: MdatFileReport = reports[0]!
		// Should have warnings (mystery missing rule) and infos (keyword expanded)
		expect(report.warnings.length + report.infos.length).toBeGreaterThan(0)
	})

	it('should categorize error messages correctly', async () => {
		const rules: Rules = {
			'empty-rule': '',
			keyword: 'content',
		}
		const markdown = `<!-- empty-rule -->\n<!-- keyword -->\n`
		const result = await expandToVfile(markdown, rules)
		const reports = getMdatReports([result])
		expect(reports[0]!.errors.length).toBeGreaterThan(0)
		expect(reports[0]!.errors[0]!.level).toBe('error')
		expect(reports[0]!.infos.some((m) => m.level === 'info')).toBe(true)
	})

	it('should normalize the source path', async () => {
		const result = await expandToVfile('<!-- k -->\n', { k: 'v' })
		result.history = ['./test/../test/file.md']
		const reports = getMdatReports([result])
		expect(reports[0]!.sourcePath).not.toContain('..')
	})

	it('should include destination path when history has multiple entries', async () => {
		const result = await expandToVfile('<!-- k -->\n', { k: 'v' })
		result.history = ['input.md', 'output.md']
		const reports = getMdatReports([result])
		expect(reports[0]!.sourcePath).toBe('input.md')
		expect(reports[0]!.destinationPath).toBe('output.md')
	})
})

describe('reporterMdat', () => {
	it('should not throw when logging reports with errors and warnings', async () => {
		const rules: Rules = {
			'empty-rule': '',
			keyword: 'content',
		}
		const markdown = `<!-- empty-rule -->\n<!-- mystery -->\n<!-- keyword -->\n`
		const result = await expandToVfile(markdown, rules)
		expect(() => {
			reporterMdat([result])
		}).not.toThrow()
	})

	it('should not throw when logging clean reports', async () => {
		const result = await expandToVfile('<!-- k -->\n', { k: 'content' })
		expect(() => {
			reporterMdat([result])
		}).not.toThrow()
	})

	it('should handle files with destination path', async () => {
		const result = await expandToVfile('<!-- k -->\n', { k: 'content' })
		result.history = ['input.md', 'output.md']
		expect(() => {
			reporterMdat([result])
		}).not.toThrow()
	})
})

describe('setLogger', () => {
	it('should accept a custom logger without throwing', () => {
		expect(() => {
			setLogger(console)
		}).not.toThrow()
	})

	it('should reset to default when called without arguments', () => {
		expect(() => {
			setLogger()
		}).not.toThrow()
	})
})

describe('barrel exports', () => {
	it('should export all public utilities', () => {
		expect(typeof mdatExpand).toBe('function')
		expect(typeof mdatCollapse).toBe('function')
		expect(typeof mdatClean).toBe('function')
		expect(typeof mdatDiff).toBe('function')
		expect(typeof mdatSplit).toBe('function')
		expect(typeof mdatStrip).toBe('function')
		expect(typeof getMdatReports).toBe('function')
		expect(typeof reporterMdat).toBe('function')
		expect(typeof setLogger).toBe('function')
		expect(typeof remarkMdat).toBe('function')
	})
})
