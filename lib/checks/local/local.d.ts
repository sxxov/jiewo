import { type Local } from '.';
import { type Static } from 'lib/checks/static';
import { type Type } from 'lib/core/type';
import { type BorrowedCheck } from 'lib/checks/borrow';

export type IllegalLocalInvalidationOfBorrowedCheck =
	BorrowedCheck<'Borrow checker: A local created from borrowed values cannot have invalidators or sources, as their lifecycles are controlled by the owner.'>;

declare global {
	const local:
		| {
				<PrimitiveLiteral extends string | number | boolean>(
					primitive: PrimitiveLiteral,
				): PrimitiveLiteral;

				// <Instance>(
				// 	instance: Instance &
				// 		IllegalLocalInvalidationOfBorrowedCheck,
				// 	dispose: (it: Instance) => void,
				// ): Local<Instance & Disposable>;

				// <Disposing extends Disposable>(
				// 	disposing: Disposing,
				// ): Local<Disposing>;

				<Unmanaged extends Partial<Record<Type, any>>>(
					unmanaged: Unmanaged,
				): Unmanaged;

				<ObjectLiteral extends Record<any, any>>(
					object: ObjectLiteral,
				): Local<ObjectLiteral>;
		  }
		| undefined;
}
