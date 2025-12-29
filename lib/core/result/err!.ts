import * as ts from 'typescript';
import { getResultIdentifier } from './result';

export default macro = function err(node, context) {
	const { factory: f } = context.context;
	const {
		arguments: [arg0],
	} = node;

	const resultIdentifier = getResultIdentifier(node, context);
	if (!resultIdentifier)
		return f.createObjectLiteralExpression([
			f.createPropertyAssignment(
				f.createIdentifier('value'),
				f.createIdentifier('undefined'),
			),
			f.createPropertyAssignment(
				f.createIdentifier('error'),
				arg0 ?? f.createIdentifier('undefined'),
			),
		]);

	return f.createCommaListExpression([
		f.createBinaryExpression(
			f.createPropertyAccessExpression(
				resultIdentifier,
				f.createIdentifier('value'),
			),
			f.createToken(ts.SyntaxKind.EqualsToken),
			f.createIdentifier('undefined'),
		),
		f.createBinaryExpression(
			f.createPropertyAccessExpression(
				resultIdentifier,
				f.createIdentifier('error'),
			),
			f.createToken(ts.SyntaxKind.EqualsToken),
			arg0 ?? f.createIdentifier('undefined'),
		),
		resultIdentifier,
	]);
};
