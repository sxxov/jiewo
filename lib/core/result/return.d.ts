import { type Ok } from 'lib/core/result/ok';
import { type Err } from 'lib/core/result/err';

declare module 'lib/core/result/ok' {
	export interface Ok<T> {
		return?: () => T;
	}
}

declare module 'lib/core/result/err' {
	export interface Err<E> {
		return?: () => never;
	}
}
