import { type MovedContainer } from 'lib/checks/move';
import {
	type IllegalReturnOfOwnedCheck,
	type IllegalReturnOfLocalCheck,
	type IllegalReturnOfStaticCheck,
} from '.';

export interface Ok<T> {
	value: T;
	error: undefined;
}

declare global {
	const ok:
		| ((<T extends MovedContainer<any>>(value: T) => Ok<T>) &
				(() => Ok<undefined>) &
				(<T = void>(
					value: T &
						IllegalReturnOfOwnedCheck &
						IllegalReturnOfLocalCheck &
						IllegalReturnOfStaticCheck,
				) => Ok<T>))
		| undefined;
}
