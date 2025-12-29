export type TypeContainer<T> = { $: T };
export type TypeWithin<T> = T extends TypeContainer<infer U> ? U : never;

export declare const Type: {
	readonly Local: unique symbol;
	readonly Static: unique symbol;
	readonly Borrowed: unique symbol;
	readonly BorrowedMutable: unique symbol;
	readonly Moved: unique symbol;
	readonly Owned: unique symbol;
};
export type Type = (typeof Type)[keyof typeof Type];
