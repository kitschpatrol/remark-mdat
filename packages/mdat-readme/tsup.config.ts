import { type Options, defineConfig } from 'tsup'

const shared: Options = {
	clean: true,
	format: 'esm',
	minify: false,
	platform: 'node',
	splitting: false,
	target: 'node16',
}

export default defineConfig([
	{
		...shared,
		dts: true,
		entry: ['src/lib/index.ts'],
		outDir: 'dist',
	},
	{
		...shared,
		dts: false,
		entry: ['src/cli/cli.ts'],
		outDir: 'bin',
	},
])