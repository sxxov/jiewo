/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type Const<T> =
	T extends Function ? T
	: T extends Record<any, any> ? { readonly [K in keyof T]: Const<T[K]> }
	: T;
