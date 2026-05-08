import type { AnnotationsConfig, VisualConfig } from './types/internal.js';

export const DEFAULT_CONFIG: AnnotationsConfig = {
	clearOnCoreInteraction: true,
	colors: {
		none: '#15781B',
		ctrl: '#882020',
		shift: '#e68f00',
		alt: '#003088',
		meta: '#6f2da8'
	}
};

export const VISUAL_CONFIG: VisualConfig = {
	circle: {
		committed: {
			strokeWidth: 0.0625,
			radius: 0.46875,
			opacity: 1
		},
		previewAdd: {
			strokeWidth: 0.05,
			radius: 0.34,
			opacity: 0.8
		},
		previewRemoveOpacity: 0.25
	},
	arrow: {
		committed: {
			strokeWidth: 0.15625,
			startOffset: 0,
			endOffset: 0.15625,
			opacity: 0.75,
			markerWidth: 4,
			markerHeight: 4,
			markerRefX: 2.05,
			markerRefY: 2,
			markerViewBox: '0 0 4 4',
			markerPathD: 'M0,0 V4 L3,2 Z'
		},
		previewAdd: {
			strokeWidth: 0.11,
			startOffset: 0,
			endOffset: 0.15625,
			opacity: 0.55,
			markerWidth: 4,
			markerHeight: 4,
			markerRefX: 2.05,
			markerRefY: 2,
			markerViewBox: '0 0 4 4',
			markerPathD: 'M0,0 V4 L3,2 Z'
		},
		previewRemoveOpacity: 0.25
	}
};
