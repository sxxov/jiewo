import transformer from 'plugin/macro/transformer';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';
import { describe, expect, it } from 'vitest';

// #region types
// ok
void (() => {
	const a = ok!(42);

	void (a.value === 42);
	void (a.error === undefined);
});
// #endregion

// #region macro
describe(`ok!`, () => {
	it('should compile to a hoisted static variable & return it', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					return ok!(42);
				}
				function bar() {
					const a = stack!(globalThis, (it) => { it.undefined = void 0; });
					return ok!(a);
				}
				`,
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__result_1 = { value: undefined, error: undefined };
			function foo() {
			    return foo__result_1.value = 42, foo__result_1.error = undefined, foo__result_1;
			}
			var bar__result_1 = { value: undefined, error: undefined };
			var bar__a_1 = globalThis;
			function bar__a__reset_1(it) {
			    it.undefined = void 0;
			}
			function bar() {
			    var a = (bar__a__reset_1(bar__a_1), bar__a_1);
			    return bar__result_1.value = a, bar__result_1.error = undefined, bar__result_1;
			}
			"
		`);
	});
});
// #endregion
