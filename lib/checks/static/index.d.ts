import { type Type, type TypeContainer } from 'lib/core/type';
import { type BorrowedCheck } from 'lib/checks/borrow';
import { type MovedContainer } from 'lib/checks/move';
import { type OwnedContainer } from 'lib/checks/own';

export type IllegalStaticInvalidationOfBorrowedCheck =
	BorrowedCheck<'Borrow checker: A static created from borrowed values cannot have invalidators or sources, as their lifecycles are controlled by the owner.'>;
export type StaticContainer<T> = { [Type.Static]?: TypeContainer<T> };
export type StaticCheck<T extends string> = { [Type.Static]?: T };
export type Static<T> =
	T extends OwnedContainer<infer U> | MovedContainer<infer U> ? Static<U>
	: T extends StaticContainer<any> ? T
	: T & StaticContainer<T>;
