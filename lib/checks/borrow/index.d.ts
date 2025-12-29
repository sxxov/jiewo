import { type TypeContainer, type Type } from 'lib/core/type';
import { type Const } from 'lib/utilities/Const';
import { type LocalContainer } from 'lib/checks/local';
import { type StaticContainer } from 'lib/checks/static';
import { type MovedContainer } from '../move';
import { type OwnedContainer } from '../own';

// #region immutable
export type BorrowedContainer<T> = {
	[Type.Borrowed]?: TypeContainer<T>;
};
export type BorrowedCheck<T extends string> = {
	[Type.Borrowed]?: T;
};
export type Borrowed<T> =
	T extends (
		| LocalContainer<infer U>
		| StaticContainer<infer U>
		| MovedContainer<infer U>
		| OwnedContainer<infer U>
		| BorrowedMutableContainer<infer U>
	) ?
		Borrowed<U>
	: T extends BorrowedContainer<any> ? T
	: Const<T> & BorrowedContainer<T>;
declare global {
	type $<T> = Borrowed<T> | BorrowedMutable<T>;
}
// #endregion

// #region mutable
export type ExpectedBorrowedMutableGotBorrowedCheck =
	BorrowedCheck<'Borrow checker: An immutable borrow cannot be passed to this receiver, as it expects to mutate the underlying value of the borrow.'>;
export type BorrowedMutableContainer<T> = {
	[Type.BorrowedMutable]?: TypeContainer<T>;
};
export type BorrowedMutableCheck<T extends string> = {
	[Type.BorrowedMutable]?: T;
};
export type BorrowedMutable<T> = (T extends (
	| LocalContainer<infer U>
	| StaticContainer<infer U>
	| MovedContainer<infer U>
	| OwnedContainer<infer U>
) ?
	BorrowedMutable<U>
: T extends BorrowedMutableContainer<any> ? T
: T & BorrowedMutableContainer<T>) &
	ExpectedBorrowedMutableGotBorrowedCheck;
declare global {
	type $$<T> = BorrowedMutable<T>;
}
// #endregion
