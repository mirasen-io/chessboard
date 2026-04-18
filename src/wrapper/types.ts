import type {
	AnyExtensionDefinition,
	ExtensionDefinitionId,
	ExtensionDefinitionPublicApi
} from '../extensions/types/extension';
import {
	BuiltInExtensionDefinitionMap,
	BuiltInExtensionId,
	DefaultBuiltinChessboardExtensions
} from '../extensions/types/wrapper';
import { Runtime } from '../runtime/types/main';
import { RuntimeStateInitOptions } from '../state/types';

/**
 * What createBoard accepts in options.extensions
 */
export type ChessboardExtensionInput = BuiltInExtensionId | AnyExtensionDefinition;

/**
 * Resolve one public input item into a concrete extension definition type
 */
export type ResolveChessboardExtensionInput<T> = T extends keyof BuiltInExtensionDefinitionMap
	? BuiltInExtensionDefinitionMap[T]
	: T extends AnyExtensionDefinition
		? T
		: never;

/**
 * Resolve an input tuple into a tuple of concrete extension definitions
 */
export type ResolveChessboardExtensionsTuple<
	TExtensions extends readonly ChessboardExtensionInput[]
> = {
	[K in keyof TExtensions]: ResolveChessboardExtensionInput<TExtensions[K]>;
};

/**
 * Extract only extensions that actually expose public API
 */
type ExtensionDefinitionHasPublicApi<T> = [ExtensionDefinitionPublicApi<T>] extends [never]
	? false
	: true;

/**
 * Public map for already-resolved extension definitions
 */
type ExtensionsPublicMap<TExtensions extends readonly AnyExtensionDefinition[]> = {
	[TDef in TExtensions[number] as ExtensionDefinitionHasPublicApi<TDef> extends true
		? ExtensionDefinitionId<TDef>
		: never]: ExtensionDefinitionPublicApi<TDef>;
};

/**
 * Public map for createBoard input extensions
 */
export type ChessboardExtensionsPublicMap<TExtensions extends readonly ChessboardExtensionInput[]> =
	ExtensionsPublicMap<
		Extract<ResolveChessboardExtensionsTuple<TExtensions>, readonly AnyExtensionDefinition[]>
	>;

/**
 * Public createBoard options
 */
interface ChessboardInitOptionsDocument {
	readonly document: Document;
	readonly element?: never;
}

interface ChessboardInitOptionsElement {
	readonly element: HTMLElement;
	readonly document?: never;
}

type ChessboardInitTarget = ChessboardInitOptionsDocument | ChessboardInitOptionsElement;

export type ChessboardInitOptions<
	TExtensions extends readonly ChessboardExtensionInput[] = DefaultBuiltinChessboardExtensions
> = ChessboardInitTarget & {
	readonly state?: RuntimeStateInitOptions;
	readonly extensions?: TExtensions;
};

/**
 * Public board interface returned by createBoard(...)
 */
export type ChessboardRuntimeSurface = Pick<
	Runtime,
	| 'mount'
	| 'unmount'
	| 'destroy'
	| 'move'
	| 'setPosition'
	| 'setPiecePosition'
	| 'setTurn'
	| 'setOrientation'
	| 'setMovability'
	| 'select'
	| 'getSnapshot'
>;

export interface Chessboard<
	TExtensions extends readonly ChessboardExtensionInput[] = DefaultBuiltinChessboardExtensions
> extends ChessboardRuntimeSurface {
	readonly extensions: ChessboardExtensionsPublicMap<TExtensions>;
}
