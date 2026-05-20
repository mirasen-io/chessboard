import type { PartialDeep, ReadonlyDeep, WritableDeep } from 'type-fest';
import type { PieceString } from '../../../../state/board/types/input.js';
import type { TMainRendererConfig } from './template.js';

export type PieceUrlsPublic = Record<PieceString, string>;

export type MainRendererConfigPublic = ReadonlyDeep<TMainRendererConfig<PieceUrlsPublic>>;

export interface MainRendererInitOptions extends PartialDeep<
	WritableDeep<MainRendererConfigPublic>
> {
	pieceUrls?: PieceUrlsPublic;
}

// Lifecycle contract: MainRendererSetConfigOptions encodes the runtime-mutable subset of
// MainRendererInitOptions. Every init-only field MUST appear in the Omit union below; adding
// a future init-only section means extending this union here.
export type MainRendererSetConfigOptions = Omit<MainRendererInitOptions, 'pieceUrls'>;
