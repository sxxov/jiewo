import { type MacroVisitor } from '.';

declare global {
	var macro: MacroVisitor | undefined;
}
