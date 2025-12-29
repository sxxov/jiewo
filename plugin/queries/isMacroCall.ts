import {
	type BaseMacroCallNode,
	type FunctionMacroCallNode,
	type MacroCallNode,
} from 'plugin/macro';
import { some } from 'plugin/utilities/some';
import * as ts from 'typescript';

export function isBaseMacroCall(node: ts.Node): node is BaseMacroCallNode {
	return (
		ts.isCallExpression(node) &&
		ts.isNonNullExpression(node.expression) &&
		!node.questionDotToken
	);
}
export function isFunctionMacroCall<Name extends string>(
	node: BaseMacroCallNode,
	name?: Name,
): node is FunctionMacroCallNode<Name> {
	return (
		ts.isIdentifier(node.expression.expression) &&
		(!some(name) || node.expression.expression.text === name)
	);
}
export function isMethodMacroCall<Name extends string>(
	node: BaseMacroCallNode,
	name?: Name,
): node is MacroCallNode<Name> {
	return (
		ts.isPropertyAccessExpression(node.expression.expression) &&
		(!some(name) || node.expression.expression.name.text === name)
	);
}
export function isMacroCall<Name extends string>(node: ts.Node, name?: Name) {
	return (
		isBaseMacroCall(node) &&
		(isFunctionMacroCall(node, name) || isMethodMacroCall(node, name))
	);
}
