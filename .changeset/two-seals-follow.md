---
'@mirasen/chessboard': patch
---

Fix fast drag-and-drop reliability in Chrome and other browsers that may dispatch `lostpointercapture` before or instead of `pointerup`.

Active drag gestures now remember the pointer button that started them. When that button is released during `lostpointercapture`, the board resolves the gesture through the same terminal release path as `pointerup` instead of cancelling it prematurely.

This fixes fast drops that could previously return a piece to its source square even when the target was valid, while preserving proper cleanup for fast releases outside the board and for extension-owned drag gestures such as annotations.
