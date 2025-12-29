import 'eslint-plugin-only-warn';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
// @ts-expect-error no types available
import xoTypeScript from 'eslint-config-xo-typescript';
import jsdoc from 'eslint-plugin-jsdoc';
import eslint from '@eslint/js';
/** @import { Linter } from "eslint" */

const config = /** @type {const} @satisfies {Linter.Config[]} */ ([
	eslint.configs.recommended,
	(() => {
		const it = jsdoc.configs['flat/logical-typescript'];
		delete it.rules;
		return it;
	})(),
	(() => {
		const it = jsdoc.configs['flat/logical-typescript-flavor'];
		delete it.rules;
		return it;
	})(),
	...tseslint.configs.recommendedTypeChecked,
	...xoTypeScript.map((/** @type {Linter.Config} */ config) => {
		if (config.rules) {
			for (const [k] of Object.entries(config.rules)) {
				if (k.startsWith('@stylistic')) {
					// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
					delete config.rules[k];
				}
			}
		}

		return { ...config };
	}),
	prettier,
	{
		rules: {
			'no-console': 'error',
			'object-shorthand': ['error', 'properties'],
			'max-nested-callbacks': ['error', 6],
			'dot-notation': 'off',
			'no-labels': 'off',
			'no-unused-labels': 'off',
			'no-extra-label': 'off',
			'no-unused-vars': 'off',
			'no-eq-null': 'off',
			'no-await-in-loop': 'off',
			'new-cap': 'off',
			'capitalized-comments': 'off',
			'no-empty-pattern': 'off',
			'func-names': 'off',
			'no-return-assign': 'off',
			'max-params': 'off',
			'no-inner-declarations': 'off',
			'no-bitwise': 'off',
			'no-lonely-if': 'off',
			'no-label-var': 'off',
			'func-name-matching': 'off',

			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: [
						'variable',
						'classProperty',
						'accessor',
						'objectLiteralProperty',
					],
					format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]|^$|_',
						match: false,
					},
				},
				{
					selector: ['function'],
					format: ['camelCase', 'PascalCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]|^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$',
						match: false,
					},
				},
				{
					selector: [
						'parameterProperty',
						'classMethod',
						'objectLiteralMethod',
						'typeMethod',
					],
					format: ['camelCase'],
					leadingUnderscore: 'forbid',
					trailingUnderscore: 'forbid',

					filter: {
						regex: '(^\\d)|[^\\w$]',
						match: false,
					},
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: 'interface',
					filter: '^(?!I)[A-Z]',
					format: ['PascalCase'],
				},
				{
					selector: 'typeParameter',
					filter: '^T$|^[A-Z][a-zA-Z]+$',
					format: ['PascalCase'],
				},
				{
					selector: 'typeAlias',
					filter: '^(?!T)[A-Z]',
					format: ['PascalCase'],
				},
				{
					selector: ['classProperty', 'objectLiteralProperty'],
					format: null,
					modifiers: ['requiresQuotes'],
				},
			],
			'@typescript-eslint/dot-notation': 'error',
			'@typescript-eslint/array-type': ['error', { default: 'array' }],
			'@typescript-eslint/class-literal-property-style': [
				'error',
				'fields',
			],
			'@typescript-eslint/consistent-type-assertions': 'off',
			'@typescript-eslint/no-redeclare': 'off',
			'@typescript-eslint/no-restricted-types': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/restrict-plus-operands': 'off',
			'@typescript-eslint/parameter-properties': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-empty-interface': 'off',
			'@typescript-eslint/no-invalid-void-type': [
				'error',
				{
					allowInGenericTypeArguments: true,
					allowAsThisParameter: true,
				},
			],
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/promise-function-async': 'off',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-deprecated': 'off',
			'@typescript-eslint/switch-exhaustiveness-check': [
				'error',
				{
					allowDefaultCaseForExhaustiveSwitch: true,
					considerDefaultExhaustiveForUnions: true,
					requireDefaultForNonUnion: true,
				},
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/member-ordering': 'off',
			'@typescript-eslint/no-unsafe-type-assertion': 'off',
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/no-extraneous-class': 'off',

			'jsdoc/no-undefined-types': [
				'error',
				{ markVariablesAsUsed: true, disableReporting: true },
			],
		},
	},
]);

export default config;
