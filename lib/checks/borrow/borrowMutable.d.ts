import { type BorrowedCheck, type BorrowedMutable } from '.';
import { type OwnedContainer } from 'lib/checks/own';

export type IllegalBorrowMutableOfImmutableCheck =
	BorrowedCheck<'Borrow checker: A borrow is immutable, & cannot be re-borrowed mutably.'>;
declare global {
	const borrowMutable:
		| {
				<T extends OwnedContainer<any>>(v: T): BorrowedMutable<T>;
				<T>(
					v: T & IllegalBorrowMutableOfImmutableCheck,
				): BorrowedMutable<T>;
		  }
		| undefined;
}
