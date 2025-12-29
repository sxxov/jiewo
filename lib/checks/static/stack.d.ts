import { type Static, type IllegalStaticInvalidationOfBorrowedCheck } from '.';
import { type Owned } from 'lib/checks/own';
import { type Type } from 'lib/core/type';

declare global {
	const stack:
		| {
				<PrimitiveLiteral extends string | number | boolean>(
					primitive: PrimitiveLiteral,
				): PrimitiveLiteral;

				<Prototype extends Record<any, any>>(
					prototype: Prototype &
						IllegalStaticInvalidationOfBorrowedCheck,
					reset: (it: Prototype) => void,
				): Static<Prototype>;

				<
					Prototype extends Record<any, any>,
					Source extends Partial<Prototype>,
				>(
					prototype: Prototype &
						IllegalStaticInvalidationOfBorrowedCheck,
					source: Source,
					reset?: (it: Static<Prototype & Source>) => void,
				): Static<Prototype & Source>;

				<Unmanaged extends Partial<Record<Type, any>>>(
					unmanaged: Unmanaged,
				): Unmanaged;

				<ObjectLiteral extends Record<any, any>>(
					object: ObjectLiteral,
				): Static<ObjectLiteral>;
		  }
		| undefined;
}
