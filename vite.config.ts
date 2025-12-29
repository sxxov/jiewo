import * as p from 'node:path';
import { defineConfig } from 'vite';
import vitePluginDts from 'unplugin-dts/vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const filename = new URL(import.meta.url).pathname;
const dirname = p.dirname(filename);

export default defineConfig({
	plugins: [
		vitePluginDts({
			include: ['plugin/**/*', 'lib/**/*'],
			exclude: ['**/*.test.ts'],
			copyDtsFiles: true,
			bundleTypes: true,
		}),
		viteTsconfigPaths(),
	],
	build: {
		minify: false,
		lib: {
			entry: 'plugin/index.ts',
			formats: ['es', 'cjs'],
			fileName: 'index',
		},
		rollupOptions: {
			external: [
				'node:path',
				'node:fs',
				'node:fs/promises',
				'node:url',
				'typescript',
			],
		},
	},
});
