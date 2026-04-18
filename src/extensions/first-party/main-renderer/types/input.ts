import { PieceString } from '../../../../state/board/types/input';
import { TMainRendererConfig } from './template';

export type PieceUrlsInput = Record<PieceString, string>;

export type MainRendererConfigInput = TMainRendererConfig<PieceUrlsInput>;
