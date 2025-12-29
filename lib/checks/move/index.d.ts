import { type LocalContainer } from 'lib/checks/local';
import { type OwnedContainer } from 'lib/checks/own';
import { type Type, type TypeContainer } from 'lib/core/type';

export type MovedContainer<T> = { [Type.Moved]?: TypeContainer<T> };
export type Moved<T> =
	T extends LocalContainer<infer U> | OwnedContainer<infer U> ? Moved<U>
	: T extends MovedContainer<any> ? T
	: T & MovedContainer<T>;
