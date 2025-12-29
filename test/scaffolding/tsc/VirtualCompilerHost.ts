import * as ts from 'typescript';
import { BaseCompilerHost } from './BaseCompilerHost';

export class VirtualCompilerHost extends BaseCompilerHost {
	public static readonly fileName = '[virtual].ts';
	public static program: ts.Program | undefined;

	public readonly target: ts.ScriptTarget;
	public readonly sourceFile: ts.SourceFile;
	public readonly program: ts.Program;

	constructor(
		public readonly compilerOptions: ts.CompilerOptions,
		public readonly content: string,
	) {
		super(compilerOptions);

		this.target = compilerOptions.target ?? ts.ScriptTarget.ESNext;
		this.sourceFile = ts.createSourceFile(
			VirtualCompilerHost.fileName,
			content,
			this.target,
			true,
		);
		this.program = ts.createProgram(
			[VirtualCompilerHost.fileName],
			compilerOptions,
			this,
			VirtualCompilerHost.program,
		);
		VirtualCompilerHost.program = this.program;
	}

	public override fileExists(fileName: string) {
		return (
			fileName === VirtualCompilerHost.fileName ||
			ts.sys.fileExists(fileName)
		);
	}

	public override readFile(fileName: string) {
		return fileName === VirtualCompilerHost.fileName ?
				this.content
			:	ts.sys.readFile(fileName);
	}

	public override getSourceFile(
		fileName: string,
		languageVersion: ts.ScriptTarget,
	) {
		if (fileName === VirtualCompilerHost.fileName) return this.sourceFile;

		const text = ts.sys.readFile(fileName);
		if (text === undefined) return undefined;

		return ts.createSourceFile(
			fileName,
			text,
			languageVersion ?? this.target,
			true,
		);
	}
}
