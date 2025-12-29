import { type MacroContext } from 'plugin';
import { isFunctionLikeDeclaration } from 'plugin/queries/isFunctionLikeDeclaration';
import * as ts from 'typescript';

export const functionToResultIdentifier = new WeakMap<
	ts.FunctionLikeDeclaration,
	ts.Identifier
>();

export function getResultIdentifier(node: ts.Node, context: MacroContext) {
	const { hoist, file } = context;
	const { factory: f } = context.context;

	const closestFunction = (() => {
		let ancestor: ts.Node = node;
		do {
			if (isFunctionLikeDeclaration(ancestor)) return ancestor;
		} while ((ancestor = ancestor.parent));
	})();
	if (!closestFunction) return;

	let resultIdentifier = functionToResultIdentifier.get(closestFunction);
	if (!resultIdentifier) {
		resultIdentifier = f.createUniqueName(
			`${closestFunction.name ? `${closestFunction.name.getText()}__` : ''}result`,
		);
		const resultVariableDeclaration = f.createVariableStatement(
			undefined,
			f.createVariableDeclarationList(
				[
					f.createVariableDeclaration(
						resultIdentifier,
						undefined,
						undefined,
						f.createObjectLiteralExpression(
							[
								f.createPropertyAssignment(
									f.createIdentifier('value'),
									f.createIdentifier('undefined'),
								),
								f.createPropertyAssignment(
									f.createIdentifier('error'),
									f.createIdentifier('undefined'),
								),
							],
							false,
						),
					),
				],
				ts.NodeFlags.Const,
			),
		);
		hoist(node, file, resultVariableDeclaration);

		functionToResultIdentifier.set(closestFunction, resultIdentifier);
	}

	return resultIdentifier;
}
