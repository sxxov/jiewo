import ts from 'typescript';
import * as p from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import tsconfigUrl from 'tsconfig.json?url';
import tsconfigContent from 'tsconfig.json?raw';
import { VirtualCompilerHost } from './VirtualCompilerHost';

const filename = fileURLToPath(import.meta.url);
const dirname = p.dirname(filename);

const parsedTsconfig = ts.parseConfigFileTextToJson(
	tsconfigUrl,
	tsconfigContent,
);
const parsedOptions = ts.convertCompilerOptionsFromJson(
	parsedTsconfig.config,
	p.dirname(tsconfigUrl),
);
const compilerOptions: ts.CompilerOptions = {
	...parsedOptions.options,
	noEmit: false,
	incremental: false,
};

export function compileWithTransformer(
	content: string,
	transformer: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>,
) {
	const host = new VirtualCompilerHost(compilerOptions, content);

	let output = '';

	host.program.emit(
		host.sourceFile,
		(fileName, data) => { output += data; },
		undefined,
		undefined,
		{ before: [transformer(host.program)] },
	);

	return output;
}
