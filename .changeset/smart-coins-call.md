---
'@mirasen/chessboard': patch
---

Prevent fast mouse dragging from triggering native browser drag-and-drop on SVG piece images.

Browsers can treat SVG images inside pieces as draggable content during quick mouse movement. When that native drag fallback starts, it can interrupt the board's pointer-driven drag flow by causing `pointercancel` / `lostpointercapture` and, in some cases, preventing the board from receiving the expected `pointerup`.

The board now suppresses native `dragstart` by default when no extension consumes the event, reducing one common source of interrupted fast mouse drags while keeping the existing `lostpointercapture` recovery path for other platform edge cases. `dragstart` remains observable by extensions and does not produce a core interaction action.
