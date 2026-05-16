---
'@mirasen/chessboard': patch
---

Fix stale lifted-piece drag cleanup when pointer capture is lost.

Fast drag gestures released outside the board could leave an active lifted-piece drag session alive if the browser delivered `lostpointercapture` instead of a normal `pointerup`. The input adapter now handles `lostpointercapture`, clears stale pointer tracking, and routes the event through the interaction controller so active drag sessions are cancelled cleanly.

This prevents dragged pieces from remaining visually attached to the pointer after an outside-board release.
