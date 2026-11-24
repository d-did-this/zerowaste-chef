# Lessons Learned & Operational Invariants

## Neumorphic Shadow Interferences
- **Sunken on Raised**: Placing a sunken element (`neo-sunken` with inset shadows) directly adjacent or with a tiny gap (< 4px) to a raised element creates double-shadow collision artifacts that appear as dark smudges or weird curved shadow lines. Always provide generous breathing space (>= 8px) or use transparent containers for floating step markers.
- **SVG Canvas Drop Shadows**: Applying CSS `filter: drop-shadow(...)` to `<img>` tags loading SVG documents treats the rectangular SVG viewport as the boundary mask rather than transparent paths inside embedded images. Food dish SVGs must use `filter: none` to avoid faint grey rectangular bounding box shadows.
- **Recipe Counter Badges**: Avoid heavy inset craters on small counters. Instead, use soft tinted badges (`rgba(0, 71, 48, 0.05)`) with subtle hairline emerald borders (`1.5px solid rgba(0, 71, 48, 0.16)`) and zero box-shadow for optimal legibility.

## Engineering Invariants
- Never regenerate entire production files from scratch; use surgical edits.
- Keep the exact existing site's styling, layout, and borders intact when integrating new flows.
- Always provide immediate back-navigation and state persistence across flow steps.

## Meal Flow & Screen Layout Invariants
- **Bottom Navigation Squish Hazard**: In fixed-height mobile viewport containers (e.g. 390x844px), having both an inner full-width action button and an outer bottom navigation bar consumes excessive vertical real estate, truncating bottom elements. The bottom tab bar must be conditionally hidden during focused modal or linear workflows.
- **Next.js Turbopack Advisory Interruption**: Next.js advisory checks can flag security vulnerabilities on build. Upgrading to patched patch-level releases (e.g., Next.js 16.4.6) resolves these fatal advisory blocks cleanly without regressions.


## Exact Prototype Cloning & Parity Invariants
- **Tailwind Approximation Deviation**: Translating custom neumorphic prototype CSS into generic Tailwind utility classes leads to subtle discrepancies in flex margins, line-heights, and inset shadow depths. When pixel parity is demanded, extract the prototype's exact CSS into a dedicated canonical stylesheet (`meal_flow_canonical.css`) and reuse the exact DOM hierarchy, IDs, and class names.
- **Appliance Hotspot State Synchronization**: Inline styles on SVG polygons and floating pills override CSS hover and active states. Maintain purely CSS-driven class selectors (`.appliance-hotspot.is-selected`, `.appliance-pill.is-selected`) to preserve spring cubic-bezier transitions and neon emerald highlights.
