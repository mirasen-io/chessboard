import { denormalizeMainRendererConfig } from './denormalize.js';
import {
	DefaultMainRendererDesktopConfig,
	DefaultMainRendererMobileConfig
} from './types/internal.js';
import type { MainRendererConfigPublic } from './types/public.js';

export const DefaultMainRendererDesktopConfigPublic: MainRendererConfigPublic =
	denormalizeMainRendererConfig(DefaultMainRendererDesktopConfig);

export const DefaultMainRendererMobileConfigPublic: MainRendererConfigPublic =
	denormalizeMainRendererConfig(DefaultMainRendererMobileConfig);
