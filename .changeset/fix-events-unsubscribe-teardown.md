---
'@mirasen/chessboard': patch
---

fix: graceful teardown in events extension unsubscribe during board.destroy()

`unsubscribeEvent` no longer asserts that the input adapter is alive — if it's already destroyed, unsubscription is a no-op since subscriptions are gone with the adapter.
