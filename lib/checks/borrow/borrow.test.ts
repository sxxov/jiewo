import { describe, expect, it } from 'vitest';
import transformer from 'plugin/macro/transformer';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';

// #region types
// no mutation
void (() => {
	const a = { a: 1 };
	const b = borrow!(a);

	// @ts-expect-error cannot assign to borrowed value
	b.a = 2;
});
// #endregion

// #region macro
describe(`borrow!`, () => {
	it('should pass through the passed in argument', () => {
		expect(
			compileWithTransformer(
				`const a = borrow!(b);`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
					"var a = b;
					"
				`);
	});
});
// #endregion
