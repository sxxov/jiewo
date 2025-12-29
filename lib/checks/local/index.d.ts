import { type MovedContainer } from 'lib/checks/move';
import { type OwnedContainer } from 'lib/checks/own';
import { type Type, type TypeContainer } from 'lib/core/type';

export type LocalContainer<T> = { [Type.Local]?: TypeContainer<T> };
export type LocalCheck<T extends string> = { [Type.Local]?: T };
export type Local<T> =
	T extends OwnedContainer<infer U> | MovedContainer<infer U> ? Local<U>
	: T extends LocalContainer<any> ? T
	: T & LocalContainer<T>;
