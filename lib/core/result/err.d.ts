import {
	type IllegalReturnOfLocalCheck,
	type IllegalReturnOfStaticCheck,
} from '.';

export interface Err<E> {
	value: undefined;
	error: E;
}

declare global {
	const err:
		| (<E = unknown>(
				error: E &
					IllegalReturnOfLocalCheck &
					IllegalReturnOfStaticCheck,
		  ) => Err<E>)
		| undefined;
}
