import {
	isFunctionMacroCall,
	isMacroCall,
	isMethodMacroCall,
} from 'plugin/queries/isMacroCall';
import { isMacroHoistableDestination } from 'plugin/queries/isMacroHoistableDestination';
import { cast } from 'plugin/utilities/cast';
import { some } from 'plugin/utilities/some';
import * as ts from 'typescript';
import {
	type MacroCallNode,
	type MacroContext,
	type MacroHoistableDestinationNode,
} from '.';
import * as macros from './macros';

const macroEntries = Object.entries(macros);

function processMacros<Node extends ts.Node>(
	node: Node,
	context: MacroTransformer,
): typeof result {
	type Return =
		Node extends MacroCallNode ? ts.VisitResult<ts.Node | undefined> : Node;

	const visit: (node: ts.Node) => ts.VisitResult<ts.Node | undefined> = (
		node,
	) => {
		const result = ts.visitEachChild(node, visit, context.context);

		const visitorResult =
			isMacroCall(result) ? context.visitor(result, context) : result;
		if (!visitorResult) return;
		if (visitorResult instanceof Array) {
			if (visitorResult.length <= 0) return visitorResult;

			const results = visitorResult.flatMap(visit).filter(some);
			return results;
		}

		return visitorResult;
	};
	const result = visit(node) as Return;

	return result;
}

function processHoists(node: ts.SourceFile, context: MacroTransformer) {
	const { hoistedNodes } = context;
	const { factory: f } = context.context;

	if (hoistedNodes.size <= 0) return node;

	const visit = (node: ts.Node) => {
		const result = ts.visitEachChild(node, visit, context.context);

		if (!isMacroHoistableDestination(result)) return result;

		let destination = result;
		const originalDestination =
			(ts.getOriginalNode(destination) as
				| typeof destination
				| undefined) ?? destination;

		const sourceNodes = hoistedNodes.get(originalDestination);
		if (!sourceNodes) return destination;

		const indexedNodes = [...sourceNodes.entries()]
			.map(([source, nodes]) => {
				const destinationAncestry = (() => {
					let ancestor: ts.Node = source;
					let statement: ts.Statement | undefined;
					for (;;) {
						if (ts.isStatement(ancestor)) statement = ancestor;

						if (!ancestor.parent) break;
						ancestor = ancestor.parent;

						if (!isMacroHoistableDestination(ancestor)) continue;
						if (
							ts.getOriginalNode(ancestor) !== originalDestination
						)
							continue;

						return { destination: ancestor, statement };
					}
				})();
				if (!destinationAncestry) return [undefined, nodes] as const;

				const {
					destination: destinationAncestor,
					statement: destinationAncestorStatement,
				} = destinationAncestry;
				if (!destinationAncestorStatement)
					return [undefined, nodes] as const;

				const destinationInsertionIndex = (() => {
					if (
						'body' in destinationAncestor &&
						destinationAncestor.body &&
						ts.isBlock(destinationAncestor.body)
					)
						return destinationAncestor.body.statements;
					if ('statements' in destinationAncestor)
						return destinationAncestor.statements;
					return [] as ts.Statement[];
				})().indexOf(destinationAncestorStatement);

				if (destinationInsertionIndex < 0)
					return [undefined, nodes] as const;

				return [destinationInsertionIndex, nodes] as const;
			})
			.sort(([a = -1], [b = -1]) => b - a);

		for (const [index = 0, nodes] of indexedNodes) {
			if ('body' in destination) {
				if (!destination.body) continue;

				if (
					ts.isArrowFunction(destination) &&
					!ts.isBlock(destination.body)
				) {
					const curr = destination;
					const next = f.updateArrowFunction(
						curr,
						curr.modifiers,
						curr.typeParameters,
						curr.parameters,
						curr.type,
						curr.equalsGreaterThanToken,
						f.createBlock(
							[
								...nodes,
								...(ts.isBlock(curr.body) ?
									[...curr.body.statements]
								:	[f.createReturnStatement(curr.body)]),
							],
							true,
						),
					);
					destination = next;

					continue;
				}
				cast<ts.Block>(destination.body);

				const curr = destination;
				const next = ts.visitEachChild(
					curr,
					(child) => {
						cast<
							Extract<
								MacroHoistableDestinationNode,
								{ body: ts.Block }
							>
						>(curr);
						if (child === curr.body)
							return f.updateBlock(curr.body, [
								...curr.body.statements.slice(0, index),
								...nodes,
								...curr.body.statements.slice(index),
							]);
						return child;
					},
					context.context,
				);
				destination = next;

				continue;
			}

			if ('statements' in destination) {
				if (ts.isSourceFile(destination)) {
					const curr = destination;
					const next = f.updateSourceFile(
						curr,
						[
							...curr.statements.slice(0, index),
							...nodes,
							...curr.statements.slice(index),
						],
						curr.isDeclarationFile,
						curr.referencedFiles,
						curr.typeReferenceDirectives,
						curr.hasNoDefaultLib,
						curr.libReferenceDirectives,
					);
					destination = next;

					continue;
				}

				if (ts.isModuleBlock(destination)) {
					const curr = destination;
					const next = f.updateModuleBlock(curr, [
						...curr.statements.slice(0, index),
						...nodes,
						...curr.statements.slice(index),
					]);
					destination = next;

					continue;
				}

				const curr = destination;
				const next = f.updateBlock(curr, [
					...curr.statements.slice(0, index),
					...nodes,
					...curr.statements.slice(index),
				]);
				destination = next;

				continue;
			}
		}

		return destination;
	};
	const result = visit(node) as ts.SourceFile;

	hoistedNodes.clear();
	return result;
}

export class MacroTransformer implements MacroContext {
	constructor(
		public readonly program: ts.Program,
		public readonly context: ts.TransformationContext,
		public readonly file: ts.SourceFile,
	) {}

	hoistedNodes = new Map<
		MacroHoistableDestinationNode,
		Map<ts.Node, ts.Statement[]>
	>();
	hoist = (
		source: ts.Node,
		destination: MacroHoistableDestinationNode,
		node: ts.Statement,
	) => {
		this.hoistImpl(source, destination, node);
	};
	protected hoistImpl(
		source: ts.Node,
		destination: MacroHoistableDestinationNode,
		node: ts.Statement,
	) {
		let sourceNodes = this.hoistedNodes.get(destination);
		if (!sourceNodes) {
			sourceNodes = new Map();
			this.hoistedNodes.set(destination, sourceNodes);
		}

		let nodes = sourceNodes.get(source);
		if (!nodes) {
			nodes = [];
			sourceNodes.set(source, nodes);
		}

		nodes.push(node);
	}

	visit = (node: ts.Node) => this.visitImpl(node);
	protected visitImpl(node: ts.Node) {
		return processMacros(node, this);
	}

	visitor = (node: MacroCallNode, context: this) =>
		this.visitorImpl(node, context);
	protected visitorImpl(node: MacroCallNode, context: this) {
		for (const [name, macro] of macroEntries) {
			if (
				!isFunctionMacroCall(node, name) &&
				!isMethodMacroCall(node, name)
			)
				continue;

			return macro(node, context as unknown as MacroContext);
		}
	}
}

export default (program: ts.Program): ts.TransformerFactory<ts.SourceFile> =>
	(context) =>
	(file) => {
		const transformer = new MacroTransformer(program, context, file);

		let complete = false;
		while (!complete) {
			const prev = file;

			file = processMacros(file, transformer);
			file = processHoists(file, transformer);

			complete = file === prev;
		}

		return file;
	};
