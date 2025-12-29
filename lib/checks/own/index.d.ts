import { type Type, type TypeContainer } from 'lib/core/type';
import { type BorrowedCheck } from 'lib/checks/borrow';
import { type LocalCheck } from 'lib/checks/local';
import { type MovedContainer } from 'lib/checks/move';
import { type StaticCheck } from 'lib/checks/static';

export type ExpectedOwnedGotLocalCheck =
	LocalCheck<'Borrow checker: You must move (`move!(value)`) this local before it can be passed to this receiver, as it expects to own the value.'>;
export type ExpectedOwnedGotStaticCheck =
	StaticCheck<'Borrow checker: A static cannot be passed to this receiver, as statics cannot be owned by anyone except its containing function, & this receiver expects to own the value.'>;
export type ExpectedOwnedGotBorrowedCheck =
	BorrowedCheck<'Borrow checker: A borrow cannot be passed to this receiver, as it expects to own the value.'>;
export type OwnedContainer<T> = { [Type.Owned]?: TypeContainer<T> };
export type OwnedCheck<T extends string> = { [Type.Owned]?: T };
export type Owned<T> = (T extends MovedContainer<infer U> ? Owned<U>
: T extends OwnedContainer<any> ? T
: T & OwnedContainer<T>) &
	ExpectedOwnedGotLocalCheck &
	ExpectedOwnedGotStaticCheck &
	ExpectedOwnedGotBorrowedCheck;
declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	type _<T> = Owned<T>;
}
