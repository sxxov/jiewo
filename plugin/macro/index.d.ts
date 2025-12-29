import type * as ts from 'typescript';

export type BaseMacroCallNode = ts.CallExpression & {
	expression: ts.NonNullExpression;
	questionDotToken: undefined;
};
export type FunctionMacroCallNode<Name extends string = string> =
	BaseMacroCallNode & {
		expression: BaseMacroCallNode['expression'] & {
			expression: ts.Identifier & { text: Name };
		};
	};
export type MethodMacroCallNode<Name extends string = string> =
	BaseMacroCallNode & {
		expression: BaseMacroCallNode['expression'] & {
			expression: ts.PropertyAccessExpression & {
				name: ts.Identifier & { text: Name };
			};
		};
	};
export type MacroCallNode<Name extends string = string> =
	| FunctionMacroCallNode<Name>
	| MethodMacroCallNode<Name>;
export type MacroVisitor<
	Node extends ts.Node = MacroCallNode,
	Context extends MacroContext<Node> = MacroContext<Node>,
> = (node: Node, context: Context) => ts.VisitResult<ts.Node | undefined>;
export type MacroHoistableDestinationNode =
	| ts.SourceFile
	| ts.ModuleBlock
	| ts.FunctionLikeDeclaration
	| ts.Block;
export interface MacroContext<Node extends ts.Node = MacroCallNode> {
	program: ts.Program;
	context: ts.TransformationContext;
	file: ts.SourceFile;

	hoistedNodes: Map<
		MacroHoistableDestinationNode,
		Map<ts.Node, ts.Statement[]>
	>;
	hoist: (
		source: ts.Node,
		destination: MacroHoistableDestinationNode,
		node: ts.Statement,
	) => void;

	visitor: MacroVisitor<Node, this>;
	visit: (node: ts.Node) => ts.VisitResult<ts.Node | undefined>;
}
