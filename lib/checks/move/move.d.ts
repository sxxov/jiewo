import { type Moved } from '.';
import { type OwnedContainer } from 'lib/checks/own';
import { type BorrowedCheck } from '../borrow';
import { type StaticCheck } from '../static';

export type IllegalMoveOfBorrowedCheck =
	BorrowedCheck<'Borrow checker: A borrow cannot be moved, as its owner still controls its lifecycle.'>;
export type IllegalMoveOfStaticCheck =
	StaticCheck<'Borrow checker: A static cannot be moved to anywhere out of its containing function, as it would leak its reference.'>;

declare global {
	const move:
		| {
				<T extends OwnedContainer<any>>(v: T, eat: never): Moved<T>;
				<T>(
					v: T &
						IllegalMoveOfBorrowedCheck &
						IllegalMoveOfStaticCheck,
					eat: never,
				): Moved<T>;
		  }
		| undefined;

	const eat: (v: any) => asserts v is never;
}
