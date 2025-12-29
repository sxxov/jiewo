import * as p from 'node:path';
import { defineConfig, mergeConfig, type Plugin } from 'vitest/config';
import config from './vite.config';
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform';

const filename = new URL(import.meta.url).pathname;
const dirname = p.dirname(filename);

export default mergeConfig(
	config,
	defineConfig({
		test: {
			resolveSnapshotPath(path, extension) {
				return p.join(
					p.dirname(path),
					'[snapshots]',
					`${p.basename(path)}.${extension}`,
				);
			},
		},
		plugins: [
			vitePluginTypescriptTransform({
				enforce: 'pre',
				tsconfig: {
					location: p.join(dirname, 'tsconfig.json'),
				},
			}) as unknown as Plugin,
		],
	}),
);
