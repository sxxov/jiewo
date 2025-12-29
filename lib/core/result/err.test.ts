import transformer from 'plugin/macro/transformer';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';
import { describe, expect, it } from 'vitest';

// #region types
// err
void (() => {
	const a = err!('uh oh');

	void (a.value === undefined);
	void (a.error === 'uh oh');
});
// #endregion

// #region macro
describe(`err!`, () => {
	it('should compile to a hoisted static variable & return it', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					return err!('uh oh');
				}
				function bar() {
					const a = stack!(globalThis, (it) => { it.undefined = void 0; });
					return err!(a);
				}
				`,
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__result_1 = { value: undefined, error: undefined };
			function foo() {
			    return foo__result_1.value = undefined, foo__result_1.error = 'uh oh', foo__result_1;
			}
			var bar__result_1 = { value: undefined, error: undefined };
			var bar__a_1 = globalThis;
			function bar__a__reset_1(it) {
			    it.undefined = void 0;
			}
			function bar() {
			    var a = (bar__a__reset_1(bar__a_1), bar__a_1);
			    return bar__result_1.value = undefined, bar__result_1.error = a, bar__result_1;
			}
			"
		`);
	});
});
// #endregion
