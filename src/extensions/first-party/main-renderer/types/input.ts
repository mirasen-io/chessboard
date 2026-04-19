import { PieceString } from '../../../../state/board/types/input.js';
import { TMainRendererConfig } from './template.js';

export type PieceUrlsInput = Record<PieceString, string>;

export type MainRendererConfigInput = TMainRendererConfig<PieceUrlsInput>;
