import type { PartialDeep, ReadonlyDeep, WritableDeep } from 'type-fest';
import type { PieceString } from '../../../../state/board/types/input.js';
import type { TMainRendererConfig } from './template.js';

export type PieceUrlsPublic = Record<PieceString, string>;

type MainRendererConfigPublic = ReadonlyDeep<TMainRendererConfig<PieceUrlsPublic>>;

export interface MainRendererInitOptions extends PartialDeep<
	WritableDeep<MainRendererConfigPublic>
> {
	pieceUrls?: PieceUrlsPublic;
}

export type MainRendererConfigPublicDrag = MainRendererConfigPublic['drag'];
export type MainRendererInitOptionsDrag = NonNullable<MainRendererInitOptions['drag']>;
