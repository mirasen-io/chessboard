---
'@mirasen/chessboard': minor
---

Add configurable desktop and mobile drag behavior.

The board now exposes interaction config APIs through `setInteractionConfig()` and `getInteractionConfig()`, including `drag.liftedActivation.thresholdPx`. This enables desktop-style immediate drag activation and mobile-style delayed drag activation from the same interaction model.

The first-party main renderer now exposes runtime config APIs through `renderer.setConfig()` and `renderer.getConfig()`. Renderer config now includes dragged-piece visual settings and animation duration:

- `drag.pieceScale`
- `drag.pieceAnchor`
- `drag.pieceAnchorOffsetY`
- `animation.durationMs`

The package also exports public desktop/mobile main-renderer defaults from `@mirasen/chessboard/extensions` as `DefaultMainRendererDesktopConfig` and `DefaultMainRendererMobileConfig`.

Set `animation.durationMs` to `0` to disable piece movement animation by skipping animation creation.

Custom extension authors may need to update runtime interaction action names and payload fields to the new drag-session naming.
