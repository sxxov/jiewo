import { some } from 'plugin/utilities/some';
import * as ts from 'typescript';

export default macro = function stack(node, context) {
	const { hoist, file } = context;
	const { factory: f } = context.context;
	let {
		arguments: [arg0, arg1, arg2],
	} = node;
	if (!arg0) return;

	const id = getInstanceName(node);

	const invalidatorParameterIdentifiers: ts.Identifier[] = [];
	const createObjectOrArrayLiteralInvalidator = (
		object: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
	) => {
		const parameterIdentifier = f.createUniqueName(`${id}__it`);
		invalidatorParameterIdentifiers.push(parameterIdentifier);

		return f.createArrowFunction(
			undefined,
			undefined,
			[
				f.createParameterDeclaration(
					undefined,
					undefined,
					parameterIdentifier,
				),
			],
			undefined,
			f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
			f.createBlock(
				getPropertyAssignmentsFromNestedObjectOrArrayLiteral(
					object,
					parameterIdentifier,
					context.context,
				),
				true,
			),
		);
	};
	const createFunctionInvalidator = (
		fun: ts.FunctionExpression | ts.ArrowFunction,
	) => fun;

	// 0. normalize arguments
	arg0 = getActualExpression(arg0);
	arg1 &&= getActualExpression(arg1);
	arg2 &&= getActualExpression(arg2);

	// 1. collect invalidators
	const invalidators = (() => {
		const it: (ts.ArrowFunction | ts.FunctionExpression)[] = [];

		if (arg0) {
			// 1.1.1.
			// const a = stack!({ a: 1, b: { c: 2 } });
			//
			// 1.1.2.
			// const a_b = stack!({ c: 2 });
			// const a = stack!({ a: 1, b: a_b });
			//
			// 1.1.3.
			// const a_b = stack!({ c: 2 }, (it) => { it.c = 2; });
			// const a = stack!({ a: 1, b: a_b }, (it) => { it.a = 1; it.b = a_b; });
			if (
				ts.isObjectLiteralExpression(arg0) ||
				ts.isArrayLiteralExpression(arg0)
			)
				it.push(createObjectOrArrayLiteralInvalidator(arg0));
		}
		if (arg1) {
			// 1.2.1.
			// const a = stack!(new Foo(), { a: 1, b: { c: 2 } });
			//
			// 1.2.2.
			// const a = stack!(new Foo(), (it) => { it.a = 1; it.b.c = 2; });
			if (
				ts.isObjectLiteralExpression(arg1) ||
				ts.isArrayLiteralExpression(arg1)
			)
				it.push(createObjectOrArrayLiteralInvalidator(arg1));

			// 1.3.1.
			// const a = stack!(new Foo(), () => { foo.reset(); });
			if (ts.isArrowFunction(arg1) || ts.isFunctionExpression(arg1))
				it.push(createFunctionInvalidator(arg1));
		}
		if (arg2) {
			// 1.4.1.
			// const a = stack!(new Foo(), { a: 1 }, (it) => { it.b ??= {}; it.b.c = 2; });
			//
			// 1.4.2.
			// const a = stack!(new Foo(), (it) => { it.a = 1; it.b ??= {}; it.b.c = 2; });
			if (ts.isArrowFunction(arg2) || ts.isFunctionExpression(arg2))
				it.push(createFunctionInvalidator(arg2));
		}

		return it;
	})();
	if (invalidators.length <= 0) return arg0;

	// 2. extract instance to module scope, attach invalidator to function body before referring variable, replace with module-scope variable
	// 2.1.
	// const a = stack!({ a: 1, b: { c: 2 } }, (it) => { it.a = 1; it.b.c = 2; });
	//
	// 2.2.
	// const a__static = { a: 1, b: { c: 2 } };
	// ...
	// a__static.a = 1;
	// a__static.b.c = 2;
	// const a = a__static;

	const topLevelIdentifier = f.createUniqueName(id);
	hoist(
		node,
		file,
		f.createVariableStatement(
			undefined,
			f.createVariableDeclarationList([
				f.createVariableDeclaration(
					topLevelIdentifier,
					undefined,
					undefined,
					arg0,
				),
			]),
		),
	);

	const invalidatorFunctionDeclarations = invalidators.map((invalidator) => {
		const name = f.createUniqueName(`${id}__reset`);

		return f.createFunctionDeclaration(
			undefined,
			undefined,
			name,
			undefined,
			invalidator.parameters,
			undefined,
			f.createBlock(
				invalidator.body ?
					ts.isBlock(invalidator.body) ?
						invalidator.body.statements
					:	[f.createReturnStatement(invalidator.body)]
				:	[],
				true,
			),
		) as ts.FunctionDeclaration & { name: typeof name };
	});
	for (const declaration of invalidatorFunctionDeclarations)
		hoist(node, file, declaration);

	return f.createCommaListExpression([
		...invalidatorFunctionDeclarations.map((declarations) =>
			f.createCallExpression(declarations.name, undefined, [
				topLevelIdentifier,
			]),
		),
		topLevelIdentifier,
	]);
};

function getInstanceName(node: ts.CallExpression) {
	let ancestor = node.parent;
	const names: string[] = [];
	do {
		if (
			(ts.isVariableDeclaration(ancestor) ||
				ts.isPropertyAssignment(ancestor)) &&
			ts.isIdentifier(ancestor.name)
		) {
			names.unshift(ancestor.name.text);
			continue;
		}

		if (ts.isFunctionDeclaration(ancestor) && ancestor.name) {
			names.unshift(ancestor.name.text);
			continue;
		}

		if (
			ts.isBinaryExpression(ancestor) &&
			ancestor.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			ts.isIdentifier(ancestor.left)
		) {
			names.unshift(ancestor.left.text);
			continue;
		}
	} while ((ancestor = ancestor.parent));

	return names.join('__') || 'anonymous';
}

function getVariableDeclarationsFromBindingName(
	name: ts.BindingName,
	base: ts.Identifier,
	context: ts.TransformationContext,
) {
	const { factory: f } = context;

	const { accesses, aliases } = getPropertyAccessesFromBindingName(
		name,
		base,
		context,
	);

	return accesses
		.map((access) => {
			const name = aliases.get(access);
			if (!name) return;

			return f.createVariableDeclaration(
				name,
				undefined,
				undefined,
				access,
			);
		})
		.filter(some);
}

function getPropertyAccessesFromBindingName(
	name: ts.BindingName,
	base: ts.Identifier,
	context: ts.TransformationContext,
) {
	if (ts.isIdentifier(name))
		return {
			accesses: [getPropertyAccessFromPropertyName(name, base, context)],
			aliases: new WeakMap<(typeof accesses)[number], ts.Identifier>(),
		};

	const accesses: (
		| ts.PropertyAccessExpression
		| ts.ElementAccessExpression
		| ts.Identifier
	)[] = [];
	const aliases = new WeakMap<(typeof accesses)[number], ts.Identifier>();
	const visit = (node: ts.Node, path: ts.PropertyName[]) =>
		ts.visitEachChild(
			node,
			(child): ts.VisitResult<ts.Node> => {
				if (!ts.isBindingElement(child)) return child;

				if (ts.isIdentifier(child.name)) {
					const access = getPropertyAccessChainFromPropertyNames(
						[...path, child.propertyName ?? child.name],
						base,
						context,
					);
					accesses.push(access);
					aliases.set(access, child.name);

					return child;
				}

				if (ts.isObjectBindingPattern(child.name) && child.propertyName)
					return visit(child.name, [...path, child.propertyName]);

				return child;
			},
			context,
		);
	visit(name, []);

	return { accesses, aliases };
}

function getPropertyAssignmentsFromNestedObjectOrArrayLiteral(
	object: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
	base: ts.Identifier,
	context: ts.TransformationContext,
) {
	const { factory: f } = context;

	const statements: ts.ExpressionStatement[] = [];
	const visitContainer = (
		node: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
		path: ts.PropertyName[],
	) => {
		if (ts.isObjectLiteralExpression(node)) {
			ts.visitEachChild(
				node,
				(child): ts.VisitResult<ts.Node | undefined> => {
					visitChild(child, path);

					return child;
				},
				context,
			);

			return;
		}

		if (ts.isArrayLiteralExpression(node)) {
			for (const [index, element] of node.elements.entries()) {
				const inner = getActualExpression(element);

				if (
					ts.isObjectLiteralExpression(inner) ||
					ts.isArrayLiteralExpression(inner)
				) {
					visitContainer(inner, [
						...path,
						f.createNumericLiteral(index),
					]);

					continue;
				}

				const access = getPropertyAccessChainFromPropertyNames(
					[...path, f.createNumericLiteral(index)],
					base,
					context,
				);
				const assignment = f.createExpressionStatement(
					f.createBinaryExpression(
						access,
						ts.SyntaxKind.EqualsToken,
						element,
					),
				);
				statements.push(assignment);
			}
		}
	};
	const visitChild = (node: ts.Node, path: ts.PropertyName[]) => {
		if (ts.isPropertyAssignment(node)) {
			const inner = getActualExpression(node.initializer);

			// { a: { b: 1 } }
			// { a: [1, 2, 3] }
			if (
				ts.isObjectLiteralExpression(inner) ||
				ts.isArrayLiteralExpression(inner)
			) {
				visitContainer(inner, [...path, node.name]);

				return;
			}

			// { a: 1 }
			const access = getPropertyAccessChainFromPropertyNames(
				[...path, node.name],
				base,
				context,
			);
			const assignment = f.createExpressionStatement(
				f.createBinaryExpression(
					access,
					ts.SyntaxKind.EqualsToken,
					node.initializer,
				),
			);
			statements.push(assignment);

			return;
		}

		// { ...a } => Object.assign(foo.bar, a);
		if (ts.isSpreadAssignment(node)) {
			const access = getPropertyAccessChainFromPropertyNames(
				path,
				base,
				context,
			);
			const assignment = f.createExpressionStatement(
				f.createCallExpression(
					f.createPropertyAccessExpression(
						f.createIdentifier('Object'),
						'assign',
					),
					undefined,
					[access, node.expression],
				),
			);
			statements.push(assignment);

			return;
		}

		// { a }
		if (ts.isShorthandPropertyAssignment(node)) {
			const access = getPropertyAccessChainFromPropertyNames(
				[...path, node.name],
				base,
				context,
			);
			const assignment = f.createExpressionStatement(
				f.createBinaryExpression(
					access,
					ts.SyntaxKind.EqualsToken,
					node.name,
				),
			);
			statements.push(assignment);

			return;
		}

		return undefined;
	};
	visitContainer(object, []);

	return statements;
}

function getPropertyAccessFromPropertyName(
	name: ts.PropertyName,
	base: ts.Expression,
	{ factory: f }: ts.TransformationContext,
) {
	if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name))
		return f.createPropertyAccessExpression(base, name);

	const access = ts.isComputedPropertyName(name) ? name.expression : name;
	return f.createElementAccessExpression(base, access);
}

function getPropertyAccessChainFromPropertyNames(
	names: ts.PropertyName[],
	base:
		| ts.PropertyAccessExpression
		| ts.ElementAccessExpression
		| ts.Identifier,
	context: ts.TransformationContext,
) {
	return names.reduce<
		ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.Identifier
	>(
		(acc, curr) => getPropertyAccessFromPropertyName(curr, acc, context),
		base,
	);
}

function getActualExpression(node: ts.Expression): ts.Expression {
	if (
		ts.isParenthesizedExpression(node) ||
		ts.isAsExpression(node) ||
		ts.isSatisfiesExpression(node) ||
		ts.isTypeAssertionExpression(node)
	)
		return getActualExpression(node.expression);

	return node;
}
