# Factory Animation Visual Fixes Plan

_v2 — incorporates Codex review feedback_

## Problem
The factory canvas mixes isometric-projected elements (floor, desk blocks) with flat 2D elements (monitors, whiteboard, kanban board, clock, plants). This creates a visual mismatch where objects look "not angled right" — they break the spatial illusion the isometric floor establishes. Additionally, one element uses `Math.random()` in the render loop causing per-frame jitter.

## Inventory of Issues

### P0 — Render-loop bug

1. **Bookshelf book jitter** — `drawBookshelf` calls `Math.random()` at lines 682-683 to generate book widths/heights. Since this runs every frame, books visibly jitter. Fix: use a deterministic pseudo-random seeded by book index, or pre-compute book geometry.

### P1 — Objects that break the isometric illusion

2. **Monitors on desks (code-forge, inspection-bay)** — Drawn as flat `roundRect` at screen coordinates. Should be parallelograms following the isometric desk surface angle, or at minimum tilted to suggest they sit on the desk plane.

3. **Launch-pad monitors** — 4 status monitors on the launch console are also flat `roundRect` (lines 564-592). Same issue as code-forge/inspection-bay monitors.

4. **Whiteboard behind blueprint-table** — Flat `roundRect` floating above the desk. Should be an isometric rectangle oriented along the back-wall plane.

5. **Kanban board** — Flat `roundRect` at a world-to-screen position. Should follow the wall plane like the whiteboard — drawn as a parallelogram aligned with the left wall.

6. **Window frame and contents** — Drawn at hardcoded canvas percentages (`vp.canvasW * 0.42`, etc.), completely outside the isometric coordinate system. The skyline, clouds, sun — all fine as a flat backdrop *if the window frame itself* is aligned to the back wall. **Sunbeam and dust motes must move with the window anchor** — `drawSunbeam` and `drawDustMotes` currently use independent hardcoded canvas positions. If the window moves but these don't follow, the scene will look worse than before.

7. **Pendant lamps** — Fixed canvas-percentage positions (`vp.canvasW * 0.22`, etc.), not anchored to the room's ceiling in isometric space.

8. **Clock** — Fixed at `vp.canvasW * 0.82, vp.canvasH * 0.06`, not in isometric space at all.

### P2 — Objects with minor angle inconsistencies

9. **Keyboard on code-forge desk** — Flat `roundRect` that should follow the desk surface angle.

10. **Coffee mug** — Flat `roundRect`, should have a slight isometric tilt.

11. **Tablet/Cintiq on design-studio** — Has a `rotate(-0.08)` but this is an arbitrary screen-space rotation, not an isometric-aligned tilt.

12. **Bookshelf contents** — The shelf block is isometric but the books inside are flat `fillRect`.

13. **Server rack LEDs and drive bays** — Flat rectangles inside an isometric block.

14. **Potted plant** — Drawn at world coordinates via `worldToScreen` but the pot/leaves are flat 2D shapes.

### P3 — Acceptable as-is (stylistic choice)

15. **Characters** — 2D facing sprites in isometric space is a standard game art convention (SimCity/RollerCoaster Tycoon). No change needed.

16. **Speech bubbles** — UI overlay, intentionally flat.

17. **Skyline/clouds/sun inside window** — Viewed through a window, flat is correct (it's a distant scene).

18. **Confetti particles** — Overlay effect, flat is fine.

## Proposed Fix Strategy

### Approach B: Selective fixes (medium effort, good payoff) — SELECTED

Fix P0 and P1 items, leave P2 items as acceptable stylistic shortcuts.

## Implementation Order

### Phase 1: Bookshelf jitter fix (P0)
Replace `Math.random()` in `drawBookshelf` with a deterministic hash based on book index. Simple seeded PRNG: `const bw = 2 + ((shelf * 4 + i) * 7.31 % 1) * 2`.

### Phase 2: Shared window/room anchors
Create a shared `RoomAnchors` struct computed from viewport that all backdrop elements reference:
- Window position and dimensions (derived from back-wall isometric coordinates)
- Sunbeam origin/spread (derived from window position)
- Dust mote region (derived from sunbeam)
- Pendant lamp ceiling anchors
- Clock wall position

This ensures when the window anchor moves, sunbeam/dust/lamps follow.

### Phase 3: Isometric geometry helpers
Add to `isometric.ts`:

```typescript
// Draw a flat quad on the floor/desk plane at a given screen-pixel elevation
drawIsoFlatQuad(ctx, vp, wx, wy, w, d, elevation: number, fill: string)

// Draw a quad on a wall plane (back wall: constant wy; left wall: constant wx)
drawWallQuad(ctx, vp, wx, wy, w, h, wall: 'back' | 'left', elevation: number, fill: string)

// Get a ceiling anchor point (world x,y projected with negative elevation)
ceilingAnchor(vp, wx, wy, ceilingH: number): {x, y}
```

All helpers use `worldToScreen` internally. Height/elevation stays in screen pixels (consistent with existing `drawIsoBlock` which uses screen-pixel `bh`).

### Phase 4: Refactor P1 elements
- Monitors (code-forge, inspection-bay, launch-pad) → `drawWallQuad` or iso-projected parallelograms standing on desk surfaces
- Whiteboard → `drawWallQuad` on back-wall plane
- Kanban board → `drawWallQuad` on left-wall plane
- Window frame → anchored to back-wall iso coordinates via `RoomAnchors`
- Pendant lamps → `ceilingAnchor` positions
- Clock → `ceilingAnchor` or wall-anchored position

### Phase 5: Verification
- Unit tests for new geometry helpers (input world coords → expected screen coords)
- Visual check matrix: idle state + working state + celebrating state, at 2 viewport sizes (360px mobile, 1200px desktop)
- Verify no `Math.random()` remains in render-loop code paths

## Files to modify

- `studio/components/factory/renderer-2d/isometric.ts` — add geometry helpers and `RoomAnchors`
- `studio/components/factory/renderer-2d/environment.ts` — refactor all P0/P1 items

## Risk

- Visual regression — the current animation works and looks decent despite the angle issues. Isometric math errors could make things look worse.
- Mitigation: implement one phase at a time, verify visually after each. Phase 1 (jitter) is zero-risk. Phase 2 (anchors) is low-risk (just consolidating positions). Phases 3-4 carry the main regression risk.
