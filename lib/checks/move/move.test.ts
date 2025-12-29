// #region types

import { describe, it, expect } from 'vitest';
import transformer from 'plugin';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';

// no mutation
void (() => {
	const a = { a: 1 };
	const b = move!(a, (eat(a), a));

	// @ts-expect-error `a` is invalid after move
	void a.a;

	// ok
	void b;
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
