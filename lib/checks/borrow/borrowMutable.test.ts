import { describe, expect, it } from 'vitest';
import transformer from 'plugin/macro/transformer';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';

// #region types
// mutable
void (() => {
	const a = stack!({ a: 1 });
	const b = borrowMutable!(a);

	b.a = 2;
});

void (() => {
	const a = stack!({ a: 1 });
	const b = borrow!(a);

	// @ts-expect-error cannot re-borrow mutably from immutable borrow
	borrowMutable!(b);
});
// #endregion

// #region macro
describe(`borrowMutable!`, () => {
	it('should pass through the passed in argument', () => {
		expect(
			compileWithTransformer(
				`const a = borrowMutable!(b);`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
					"var a = b;
					"
				`);
	});
});
// #endregion
