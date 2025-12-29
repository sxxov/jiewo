/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import * as ts from 'typescript';

export class BaseCompilerHost {
	constructor(compilerOptions: ts.CompilerOptions) {
		Object.setPrototypeOf(
			Object.getPrototypeOf(this),
			ts.createCompilerHost(compilerOptions),
		);
	}
}
export interface BaseCompilerHost extends ts.CompilerHost {}
