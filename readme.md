# `jiewo`（借我）

A silly, crabby, borrow checker for TypeScript.

## Overview

This project was created to help write **extremely high-performance TypeScript code**, by enforcing strict ownership and borrowing rules at compile time, similar to Rust's borrow checker.

This, whilst not perfect, does this by working within the constraints of TypeScript's type system, & can enable significant performance wins without leaving the JavaScript/TypeScript ecosystem. Performance is achieved by heavy reuse of memory allocations, & subsequently reducing garbage collection pressure in high-performance applications.

If you are not forced to use JavaScript/TypeScript for a performance-critical application, **you do not need this library**. Please just use Rust, Zig, Go, C, C++, or even C#, instead.

In fact, even if you are writing a performance-critical application in JavaScript/TypeScript, you might not need this library either, as it's the principles drives this library, by enforcing or compiling them down. Once understood, they can easily be replicated by hand.

### Architecture

`jiewo` is implemented in two parts,

1. A a standard library of TypeScript types that perform borrow checking at the type-level.
2. A TypeScript transformer plugin, that provides "macros" that do special transformations at build time to help write borrow-checked code.

### Usage

Firstly, you will need a to get TypeScript to use the plugin, & also make your build tool use `tsc` to do downleveling instead of their builtin solution (i.e. `esbuild` on vite or `swc` on turbopack).

#### 1. Install `jiewo`

We install it as a development dependency since it only exists at build time.

```bash
npm i -D jiewo
```

#### 2. Install `ts-patch`

By default, TypeScript doesn't expose a way to run transformers easily. So we'll need a solution like `ts-patch`, which modifies the currently installed TypeScript compiler to allow custom transformers to be used via `tsconfig.json`.

```bash
npm i -D ts-patch
npx ts-patch install
```

#### 3. Add `ts-patch` to your `package.json` scripts

This ensures that `ts-patch` is re-applied whenever your dependencies are installed.

**package.json**

```json
{
	"scripts": {
		"prepare": "ts-patch install -s"
	}
}
```

#### 4. Add `jiewo` to your `tsconfig.json`

Now, we can add `jiewo` as a transformer in our `tsconfig.json`.

**tsconfig.json**

```json
{
	"compilerOptions": {
		"plugins": [
			{
				"transform": "jiewo"
			}
		]
	}
}
```

#### 5. Configure your build tool to use TypeScript

This step is required if you use a modern build tool, since `tsc` is no longer commonly used for compilation, in favour of faster tools like `esbuild` or `swc`.

##### Vite

In Vite, you can use the [`vite-plugin-typescript-transform`](https://www.npmjs.com/package/vite-plugin-typescript-transform) plugin to add custom TypeScript transformers.

```bash
npm i -D vite-plugin-typescript-transform
```

Then, add it to your `vite.config.js`:

```js
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform';

export default {
	plugins: [
		vitePluginTypescriptTransform({
			// IMPORTANT: Ensure `tsc` & the `jiewo` transformer runs
			// *before* vite down-levels our code to JavaScript
			enforce: 'pre',
			// Optional: Specify the location of your tsconfig.json,
			// this resolves issues where `vitest` or other tools
			// run vite from a different working directory
			tsconfig: {
				location: './tsconfig.json',
			},
		}),
	],
};
```

> [!NOTE]
> **TODO**: Add instructions for other build tools (e.g. turbopack, webpack, etc.).
> Contributions welcome!

## Benchmark

See [`jiewo-sudoku`](https://github.com/sxxov/jiewo-sudoku) for a benchmark of a Sudoku solver written with `jiewo`, compared to other implementations.

### Example Run

Using `jiewo` produces a solver that is about **50% faster** than "idiomatic" TypeScript.

```
 ✓ test/all/index.bench.ts 2123ms
     name             hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · managed    2,662.10  0.3339  0.5036  0.3756  0.3799  0.3939  0.4015  0.4328  ±0.13%     1332
   · unmanaged  1,351.65  0.6619  0.8552  0.7398  0.7458  0.8070  0.8139  0.8552  ±0.20%      676
   · idiomatic  1,863.47  0.4717  0.6816  0.5366  0.5435  0.5976  0.6283  0.6816  ±0.22%      932
```

## Use-cases

### Performance-critical libraries

If you are writing a performance-critical library in TypeScript, such as a game engine, physics engine, or data processing library, `jiewo` can help you manage memory more efficiently by enforcing strict ownership and borrowing rules within the innards of the libary.

To make it more idiomatic/ergonomic for the consumers of your library, you can then perform any dereferencing/copies at the final API boundary, or provide an API that uses "containers" to hold borrowed values.

An example of an API that would benefit is [`three`](https://threejs.org/)'s math methods that takes an existing `Vector3` as an "out" parameter to avoid allocations.

```ts
// hypothetical example of a three.js-like API
import { Vector3, Camera } from '<example>';

function main(x: number, y: number, z: number) {
	// declare "function-static" variables, where the value
	// is effectively a singleton scoped to the function.
	// you can also provide a resetter function that runs
	// right before the declaration.
	// `vec`'s resetter runs here
	const vec = stack!(new Vector3(), (v) => v.set(0, 0, 0));
	// `camera`'s resetter runs here
	const camera = stack!(new Camera(), (c) => c.reset());

	// mutate the camera's position freely as the static owner
	camera.position.set(x, y, z);

	// write the world direction into the mutable borrow of `vec`
	const worldDirection = camera.getWorldDirection($$!(vec));

	// normalize the static vector in-place
	vec.normalize();

	// pass the vector off to be saved in the database, &
	// "eat" it to prevent further use in this scope.
	// the function returns a, also function-static,
	// `Result` object.
	const { error } = saveToDatabase(move!(vec, (eat?.(vec), vec)));

	// we use the `err!` & `ok!` macros to return our own
	// "function-static" (zero-allocation) `Result` object.
	if (error) return err!(error);
	return ok!();
}

// take the vector & own it
function saveToDatabase(vec: /* Vector3 */ _<Vector3>) {
	if (vec.x === 0 && vec.y === 0 && vec.z === 0)
		return err!('Cannot save zero vector');

	// pretend we saved to the database here...

	return ok!();
}
```

### Hot path optimizations

Most applications have code paths that are executed frequently & require optimal performance. `jiewo` can help optimize these "hot paths" by guaranteeing object reuse & minimising wasteful allocations.

```ts
function main() {
	// create a "function-static" sum vector
	const sum = stack!(new Vector3(), (v) => v.set(0, 0, 0));

	for (let i = 0; i < 1_000_000; i++) {
		// create a "loop-static" vector that is reused &
		// reset across all iterations of the loop
		const vec = stack!(new Vector3(), (v) => v.set(0, 0, 0));

		// perform operations in-place on `vec`
		doSomething($!(vec), $$!(vec));

		// accumulate the result into the sum vector
		sum.add(vec.x, vec.y, vec.z);
	}

	// return a result of the sum vector
	return ok!(sum);
}

// make the user pass in an `out` vector to be deliberate about
// allocations. we also mark it as a mutable borrow instead of an
// owned value to ensure this function is deliberate when passing
// it around, or returning it.
function doSomething(
	source: /* &Vector3 */ $<Vector3>,
	out: /* &mut Vector3 */ $$<Vector3>,
) {
	// read from the immutably borrowed `source`
	console.log(`(${source.x}, ${source.y}, ${source.z})`);

	// write to the mutably borrowed `out`
	out.set(source.x * 2, source.y * 2, source.z * 2);
}
```

## API

### Macros

#### `$!(value)` (or `borrow!(value)`)

Returns a read-only reference to the given value. The value cannot be mutated while it is borrowed.

```ts
const value = { x: 10, y: 20 };
const borrowed = $!(value);
console.log(borrowed.x); // 10
borrowed.x = 30; // Error: Cannot assign to 'x' because it is a read-only property.
```

#### `$$!(value)` (or `borrowMutable!(value)`)

Returns a mutable reference to the given value, that cannot be received by a function that requires ownership of the value.

```ts
const value = { x: 10, y: 20 };
const borrowedMutable = $$!(value);
borrowedMutable.x = 30; // OK
console.log(borrowedMutable.x); // 30
```

#### `move!(value, eaten)`

Returns a value that can be passed out of the current scope into another owner. Requires you to "eat" the original value in the second argument, which prevents further use of the original value in the current scope.

```ts
const value = { x: 10, y: 20 };
const moved = move!(value, (eat(value), value));
void value.x; // Error: Property 'x' does not exist on type 'never'.
```

> [!NOTE]
> This syntax is a little funky, but it's necessary to work around limitations in TypeScript's type system.
>
> The second argument _must_ be a comma expression that first calls `eat(value)` (**NOT** `eat!(value)`), followed by the original `value`.
>
> This is due to how TypeScript is picky about `asserts`-returning function calls, & we need to ensure that the `eat` function is called along-side the move, to properly narrow its type to `never`.
>
> Here are a list of usages that don't work:
>
> ```ts
> // does NOT work, DO NOT do these!
> move!(value, (eat!(value), value));
> move!(value, eat(value), value);
> move!(value, eat(value));
> move!(value, eat(value));
> ```

#### `stack!(literal)` (Auto static)

Creates a function-static-scoped value (like a `static` variable in PHP) with an auto-generated resetter for literal values (i.e. literal objects & arrays).

```ts
// IMPORTANT: `stack!` must be used inside a function
function main() {
	const obj = stack!({ x: 0, y: 0 });
	// use `obj`...
}
```

The rules for the auto-generated resetter are:

1. For trivially copyable properties (i.e. numbers, strings, booleans, `null`, `undefined`) throughout the nested literal structure (i.e. `[]`s or `{}`s), the resetter will simply re-assign the value to the original literal's path, e.g. `obj.foo.bar[1][Symbol.dispose] = 0`.
2. For non-trivially copyable properties (i.e. objects, arrays, functions, classes), the resetter will **NOT** re-assign the value, & will leave it as-is. You must manually reset these properties in a custom resetter function instead (see: ["Managed static—with function"](#stackvalue-resetter-managed-staticwith-function)).
3. Spread properties (`...obj`) will use `Object.assign` to copy over the properties from the original literal to the static value.

> [!NOTE]
> This roughly compiles to the following:
>
> ```ts
> const main__obj_1 = { x: 0, y: 0 };
> function main__obj__resetter_1(main__obj__it_1) {
> 	main__obj__it_1.x = 0;
> 	main__obj__it_1.y = 0;
> }
> function main() {
> 	const obj = (main__obj__resetter_1(main__obj_1), main__obj_1);
> 	// use `obj`...
> }
> ```
>
> Thus, this means you can use it in other scopes, such as loops or conditionals, & it will auto-reset the value right at the declaration site.
>
> ```ts
> function main() {
> 	for (let i = 0; i < 10; i++) {
> 		const obj = stack!({ x: 0, y: 0 });
> 		const axis = i % 2 === 0 ? 'x' : 'y';
> 		obj[axis] = 10;
> 		console.log(`(${obj.x}, ${obj.y})`);
> 	}
> 	// prints (10, 0), (0, 10), (10, 0), (0, 10), ...
> }
> ```

#### `stack!(value, resetter)` (Managed static—with function)

Creates a function-static-scoped value (like a `static` variable in PHP), with an resetter function that runs before the declaration.

```ts
// IMPORTANT: `stack!` must be used inside a function
function main() {
	const vec = stack!(new Vector3(), (v) => v.set(0, 0, 0));
	// use `vec`...
}
```

If you provide a literal as the first argument, the auto-resetter rules from the ["Auto static"](#stackliteral-auto-static) version of `stack!` still apply, & the provided resetter function runs after the auto-resetter.

> [!NOTE]
> This roughly compiles to the following:
>
> ```ts
> const main__vec_1 = new Vector3();
> function main__vec__resetter_1(v) {
> 	v.set(0, 0, 0);
> }
> function main() {
> 	const vec = (main__vec__resetter_1(main__vec_1), main__vec_1);
> 	// use `vec`...
> }
> ```
>
> Thus, this means you can use it in other scopes, such as loops or conditionals, & it will run the resetter right at the declaration site.
>
> ```ts
> function main() {
> 	for (let i = 0; i < 10; i++) {
> 		const vec = stack!(new Vector3(), (v) => { console.log('reset'); });
> 	}
> 	// prints "reset" 10 times
> }
> ```
>
> However, this also means you must NOT use any scoped values in the resetter function, since it runs outside of the current scope. This is a design decision that ensures JIT compilers can optimise the resetters as monomorphic functions without performing fancy closure captures.
>
> If you need to use scoped values, just move the logic into the main body of the function instead.

#### `stack!(value, source, resetter?)` (Managed static—with record (and/or function))

Creates a function-static-scoped value (like a `static` variable in PHP), with an optional source record that provides default values to copy from, & an optional resetter function that runs before the declaration.

```ts
// IMPORTANT: `stack!` must be used inside a function
function main() {
	const vec = stack!(new Vector3(), { x: 0, y: 0, z: 0 }, (v) => {
		console.log('reset', v);
	});
	// use `vec`...
}
```

The rules for the source record (& still the input value) is the same as the ["Auto static"](#stackliteral-auto-static) version of `stack!`, & the rules for the resetter function is the same as the ["Managed static—with function"](#stackvalue-resetter-managed-staticwith-function) version of `stack!`.

> [!NOTE]
> This roughly compiles to the following:
>
> ```ts
> const main__vec_1 = new Vector3();
> function main__vec__resetter_1(main__vec__it_1) {
> 	main__vec__it_1.x = 0;
> 	main__vec__it_1.y = 0;
> 	main__vec__it_1.z = 0;
> }
> function main__vec__resetter_2(v) {
> 	console.log('reset', v);
> }
> function main() {
> 	const vec =
> 		(main__vec__resetter_1(main__vec_1),
> 		main__vec__resetter_2(main__vec_1),
> 		main__vec_1);
> 	// use `vec`...
> }
> ```

#### `stack!(any)` (Unmanaged static)

Do not use this. This is the fallback identity macro that occurs when the macro fails to recognise any resetters. It continues to mark the value as "function-static" at the type level, but will re-create the value on every declaration, without any reset logic.

#### `local!(value)`

🚧 Work-in-progress. This macro currently does nothing (identity). However, it should in the future, integrate with the new `using` keyword in JavaScript & perform some sort of reference-counting based invalidation/disposing with the same syntax as `stack!`

#### `ok!(value)`/`err!(error)`

This is the main "out" point of the function that still enforces borrowing rules (e.g. `stack!`-created values cannot be returned without a borrow). It also creates a zero-allocation "function-static" `Result` object.

```ts
// NOTE: you should ALWAYS destructure the returned `Result` object
// as the actual result is a "function-static" value, & keeping a
// reference to it & calling the function again WILL overwrite
// the value (use-after-free).
const { value: foo, error: fooError } = ok!(42);
if (fooError) return err!(fooError);
console.log(foo); // 42
```

### Types

#### `$<T>` (or `Borrowed<T>`)

Use this in function signatures to indicate a read-only borrow of a value.

```ts
function doSomething(value: $<SomeType>) {
	// can read from `value`, but cannot mutate it
	console.log(value.prop);
	value.prop = 42; // Error: Cannot assign to 'prop' because it is a read-only property.
}
```

> [!NOTE]
> You may also use this in class `this` types to indicate that the method does not mutate the instance. This enables you to call such methods on both all types of instances.
>
> ```ts
> class MyClass {
> 	prop: number;
>
> 	getProp(this: $<MyClass>) {
> 		return this.prop; // OK
> 	}
> }
> ```

#### `$$<T>` (or `BorrowedMutable<T>`)

Use this in function signatures to indicate a mutable borrow of a value, but not ownership.

```ts
function doSomethingMutable(value: $$<SomeType>) {
	// can read from & mutate `value`
	console.log(value.prop);
	value.prop = 42; // OK
}
```

> [!NOTE]
> You may also use this in class `this` types to indicate that the method mutates the instance. This enables you to call such methods only on mutably borrowed or owned instances.
>
> ```ts
> class MyClass {
> 	prop: number;
>
> 	setProp(this: $$<MyClass>, value: number) {
> 		this.prop = value; // OK
> 	}
> }
> ```

#### `_<T>` (or `Owned<T>`)

Use this in function signatures to indicate ownership of a value.

```ts
function doSomethingOwned(value: _<SomeType>) {
	// can read from & mutate `value`
	console.log(value.prop);
	value.prop = 42; // OK
}
```

#### `Static<T>`

This is the type returned by the `stack!` macro, indicating that the value is function-static scoped. You may not take ownership of this value, but you may borrow it (immutably or mutably) within the function scope.

```ts
function main() {
	const value = stack!(new SomeType());
	return ok!(move!(value, (eat(value), value))); // Error: Borrow checker: A static cannot be moved to anywhere out of its containing function, as it would leak its reference.
}
```

#### `Local<T>`

🚧 Work-in-progress. This type works similarly to the [`Static<T>`](#statict) type, but will be less strict about ownership.

#### `Ok<T>`/`Err<E>`/`Result<T, E>`

These types represent the result of an operation that can either succeed with a value of type `T` or fail with an error of type `E`. They are similar to Rust's `Result` type.

```ts
function doSomething(): Result<number, string> {
	if (Math.random() > 0.5) {
		return ok!(42); // { value: 42, error: undefined }
	} else {
		return err!('Something went wrong'); // { value: undefined, error: 'Something went wrong' }
	}
}
```

# License

MIT
