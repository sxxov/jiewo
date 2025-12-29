import { type LocalCheck } from 'lib/checks/local';
import { type OwnedCheck } from 'lib/checks/own';
import { type StaticCheck } from 'lib/checks/static';
import { type Err } from './err';
import { type Ok } from './ok';

export type Result<T, E = unknown> = (Ok<T> | Err<E>) & Any<T, E>;
export interface Any<T, E> {}

export type IllegalReturnOfStaticCheck =
	StaticCheck<'Borrow checker: A static cannot be returned out of its containing function, as it would leak its reference.'>;
export type IllegalReturnOfLocalCheck =
	LocalCheck<'Borrow checker: You must move (`move!(value)`) or borrow (`borrow!(value)`) this local before it can be returned out of its containing function.'>;
export type IllegalReturnOfOwnedCheck =
	OwnedCheck<'Borrow checker: You must move (`move!(value)`) this owned value before it can be returned out of its containing function.'>;
