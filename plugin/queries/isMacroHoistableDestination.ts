import * as ts from 'typescript';
import { type MacroHoistableDestinationNode } from 'plugin/macro';
import { isFunctionLikeDeclaration } from './isFunctionLikeDeclaration';

export function isMacroHoistableDestination(
	node: ts.Node,
): node is MacroHoistableDestinationNode {
	return (
		ts.isSourceFile(node) ||
		ts.isBlock(node) ||
		ts.isModuleBlock(node) ||
		isFunctionLikeDeclaration(node)
	);
}
