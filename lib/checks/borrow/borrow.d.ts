import { type Borrowed } from '.';

declare global {
	const borrow: (<T>(value: T) => Borrowed<T>) | undefined;
}
