import { describe, expect, it } from 'vitest';
import transformer from 'plugin/macro/transformer';
import { compileWithTransformer } from 'test/scaffolding/tsc/compileWithTransformer';

// #region types
// object literal
void (() => {
	const a = stack!({ a: 1 });
	void a;
});

// source
void (() => {
	const a = stack!(globalThis, { undefined });
	void a;
});

// primitive
void (() => {
	const a = stack!(42);
	void a;
});

// invalidator
void (() => {
	const a = stack!(globalThis, (it) => { it.undefined = undefined; });
	void a;
});

// source + invalidator
void (() => {
	const a = stack!(globalThis, { undefined }, (it) => {
		it.undefined = undefined;
	});
	void a;
});
// #endregion

// #region macro
describe(`stack!`, () => {
	it('should pass through primitive', () => {
		expect(
			compileWithTransformer(
				`const a = stack!(42);`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var a = 42;
			"
		`);
	});
	it('should normalize object literal to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!({
						a: 1,
						b: {
							c: 2,
							d: [
								3,
								{
									e: 4,
								}
							]
						}
					});
				}`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = {
			    a: 1,
			    b: {
			        c: 2,
			        d: [
			            3,
			            {
			                e: 4,
			            }
			        ]
			    }
			};
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1.a = 1;
			    foo__a__it_1.b.c = 2;
			    foo__a__it_1.b.d[0] = 3;
			    foo__a__it_1.b.d[1].e = 4;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize array literal to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!([0, 1, 2, [0, 1, 2], { a: 3 }]);
				}`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = [0, 1, 2, [0, 1, 2], { a: 3 }];
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1[0] = 0;
			    foo__a__it_1[1] = 1;
			    foo__a__it_1[2] = 2;
			    foo__a__it_1[3][0] = 0;
			    foo__a__it_1[3][1] = 1;
			    foo__a__it_1[3][2] = 2;
			    foo__a__it_1[4].a = 3;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize object source to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!(globalThis, { undefined });
				}
				`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = globalThis;
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1.undefined = undefined;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize object invalidator to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!(globalThis, (it) => {
						it.undefined = void 0;
					});
				}
				`,
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = globalThis;
			function foo__a__reset_1(it) {
			    it.undefined = void 0;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize object source & invalidator to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!(globalThis, { undefined }, (it) => {
						it.undefined = void 0;
					});
				}
				`,
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = globalThis;
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1.undefined = undefined;
			}
			function foo__a__reset_2(it) {
			    it.undefined = void 0;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a__reset_2(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize literals at input & source, plus an invalidator, to invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!(
						{ a: 1, b: undefined as 2 | undefined },
						{ b: 2 },
						(it) => { it.a = 2; },
					);
				}
				`,
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = { a: 1, b: undefined };
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1.a = 1;
			    foo__a__it_1.b = undefined;
			}
			function foo__a__reset_2(foo__a__it_2) {
			    foo__a__it_2.b = 2;
			}
			function foo__a__reset_3(it) {
			    it.a = 2;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a__reset_2(foo__a_1), foo__a__reset_3(foo__a_1), foo__a_1);
			}
			"
		`);
	});
	it('should normalize destructuring in invalidator', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!(new Foo(), (it) => {
						const { undefined: un } = globalThis;
						it.undefined = un;
					});
				}
				function bar() {
					const a = stack!(new Bar(), ({ undefined: un }) => {
						globalThis.undefined = un;
					});
				}
				`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = new Foo();
			function foo__a__reset_1(it) {
			    var un = globalThis.undefined;
			    it.undefined = un;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			var bar__a_1 = new Bar();
			function bar__a__reset_1(_a) {
			    var un = _a.undefined;
			    globalThis.undefined = un;
			}
			function bar() {
			    var a = (bar__a__reset_1(bar__a_1), bar__a_1);
			}
			"
		`);
	});
	it('should skip "as", "satisfies", parentheses, & legacy type-cast', () => {
		expect(
			compileWithTransformer(
				`
				function foo() {
					const a = stack!({ a: 1 } as { a: 1 });
				}
				function bar() {
					const a = stack!(({ a: 1 } satisfies { a: 1 }));
				}
				function baz() {
					const a = stack!((<{ a: 1 }>{ a: 1 }) as { a: 1 });
				}
				function qux() {
					const a = stack!({ a: { b: 2 } as { b: number } });
				}
				`, //
				transformer,
			),
		).toMatchInlineSnapshot(`
			"var foo__a_1 = { a: 1 };
			function foo__a__reset_1(foo__a__it_1) {
			    foo__a__it_1.a = 1;
			}
			function foo() {
			    var a = (foo__a__reset_1(foo__a_1), foo__a_1);
			}
			var bar__a_1 = { a: 1 };
			function bar__a__reset_1(bar__a__it_1) {
			    bar__a__it_1.a = 1;
			}
			function bar() {
			    var a = (bar__a__reset_1(bar__a_1), bar__a_1);
			}
			var baz__a_1 = { a: 1 };
			function baz__a__reset_1(baz__a__it_1) {
			    baz__a__it_1.a = 1;
			}
			function baz() {
			    var a = (baz__a__reset_1(baz__a_1), baz__a_1);
			}
			var qux__a_1 = { a: { b: 2 } };
			function qux__a__reset_1(qux__a__it_1) {
			    qux__a__it_1.a.b = 2;
			}
			function qux() {
			    var a = (qux__a__reset_1(qux__a_1), qux__a_1);
			}
			"
		`);
	});
});
// #endregion
