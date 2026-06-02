import React from 'react';

// ─── Rank definitions ─────────────────────────────────────────────────────────
// Points thresholds are tiered so reaching higher ranks requires progressively
// harder climbing, not just volume. The gap between Diamond and Masters is
// large intentionally — it should feel like a significant achievement.
// These thresholds mirror the grade_to_points function in views.py:
//   V0-2 = 10pts, V3-4 = 20pts, V5-6 = 40pts, V7-8 = 70pts,
//   V9-10 = 100pts, V11+ = 150pts

export const RANKS = [
  { name: 'Iron',     min: 0,    color: '#757575', bg: '#F5F5F5' },
  { name: 'Bronze',   min: 100,  color: '#A0522D', bg: '#FFF3E0' },
  { name: 'Silver',   min: 300,  color: '#546E7A', bg: '#ECEFF1' },
  { name: 'Gold',     min: 700,  color: '#B8860B', bg: '#FFFDE7' },
  { name: 'Platinum', min: 1200, color: '#00838F', bg: '#E0F7FA' },
  { name: 'Diamond',  min: 2000, color: '#3949AB', bg: '#E8EAF6' },
  { name: 'Emerald',  min: 3000, color: '#2E7D32', bg: '#E8F5E9' },
  { name: 'Masters',  min: 4500, color: '#7B1FA2', bg: '#F3E5F5' },
];

// Magnus is positional (top 20 per gym), not points-based, so it lives outside
// the RANKS array. It overrides any points-based rank on the leaderboard.
// Named after Magnus Midtbø — a nod to elite-level climbing.
export const MAGNUS_RANK = { name: 'Magnus', color: '#C62828', bg: '#FFEBEE' };

// Returns the appropriate rank for a user.
// position is their 1-based rank on the gym leaderboard — if they're in the
// top 20 they get Magnus regardless of points. On the profile page, position
// is null because there's no gym context, so it falls through to points.
export function getRank(points, position = null) {
  if (position !== null && position <= 20) return MAGNUS_RANK;
  // Iterate from highest to lowest threshold so the first match wins.
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

// Must match the grade_to_points function in views.py exactly — if they
// diverge, the profile rank badge will show a different tier than the leaderboard.
function gradeToPoints(grade) {
  if (grade <= 2) return 10;
  if (grade <= 4) return 20;
  if (grade <= 6) return 40;
  if (grade <= 8) return 70;
  if (grade <= 10) return 100;
  return 150;
}

// Calculates total active points from a user's sends array (as returned by
// the SendSerializer). Archived climbs are filtered out so the rank reflects
// the current gym set, not historical sends on removed routes.
// climb_is_archived comes from the climb_is_archived field added to SendSerializer.
export function calculatePoints(sends) {
  return sends
    .filter(s => !s.climb_is_archived)
    .reduce((total, s) => total + gradeToPoints(s.climb_grade), 0);
}

// ─── Pixel-art SVG icons (16×16 viewBox, shapeRendering crispEdges) ───────────
// Each icon is a climbing-themed pixel art design. shapeRendering="crispEdges"
// tells the browser to render without anti-aliasing so the pixel grid stays
// sharp at small sizes rather than blurring.

function IronIcon({ size }) {
  // Carabiner: oval ring with a gate notch on the right side
  const c = '#757575';
  const g = '#BDBDBD'; // lighter colour for the openable gate section
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="1" width="8" height="2" fill={c}/>
      <rect x="2" y="3" width="2" height="10" fill={c}/>
      <rect x="4" y="13" width="8" height="2" fill={c}/>
      <rect x="12" y="3" width="2" height="3" fill={c}/>
      <rect x="12" y="10" width="2" height="3" fill={c}/>
      {/* Gate gap — lighter to indicate it opens */}
      <rect x="12" y="6" width="2" height="4" fill={g}/>
    </svg>
  );
}

function BronzeIcon({ size }) {
  // Chalk bag: drawstring neck narrowing into a wide body
  const c = '#A0522D';
  const l = '#CD853F'; // lighter top opening
  const chalk = '#F5DEB3'; // chalk puff visible at the top
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="1" width="2" height="2" fill={c}/>
      <rect x="9" y="1" width="2" height="2" fill={c}/>
      <rect x="4" y="3" width="8" height="2" fill={l}/>
      <rect x="3" y="5" width="10" height="7" fill={c}/>
      <rect x="4" y="12" width="8" height="2" fill={c}/>
      <rect x="5" y="14" width="6" height="1" fill={c}/>
      <rect x="5" y="3" width="2" height="1" fill={chalk}/>
      <rect x="9" y="3" width="2" height="1" fill={chalk}/>
    </svg>
  );
}

function SilverIcon({ size }) {
  // Climbing shoe: ankle collar, tongue, midsole, and downturned rubber toe
  const upper = '#546E7A';
  const rubber = '#37474F'; // darker rubber sole and rand
  const tongue = '#78909C'; // slightly lighter tongue
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="5" height="5" fill={upper}/>
      <rect x="3" y="2" width="3" height="3" fill={tongue}/>
      <rect x="1" y="7" width="11" height="3" fill={upper}/>
      <rect x="2" y="10" width="7" height="2" fill={rubber}/>
      <rect x="9" y="9" width="5" height="3" fill={rubber}/>
      <rect x="13" y="8" width="2" height="3" fill={rubber}/>
      <rect x="2" y="12" width="9" height="2" fill={rubber}/>
    </svg>
  );
}

function GoldIcon({ size }) {
  // ATC belay device: trapezoidal body with two rope slots and a wire gate
  const c = '#B8860B';
  const slot = '#FFF9C4'; // rope slots cut through the device
  const gate = '#DAA520'; // wire gate at the top for clipping
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="10" height="9" fill={c}/>
      <rect x="4" y="4" width="3" height="7" fill={slot}/>
      <rect x="9" y="4" width="3" height="7" fill={slot}/>
      <rect x="6" y="12" width="4" height="2" fill={c}/>
      <rect x="5" y="1" width="6" height="2" fill={gate}/>
      <rect x="4" y="2" width="1" height="1" fill={gate}/>
      <rect x="11" y="2" width="1" height="1" fill={gate}/>
    </svg>
  );
}

function PlatinumIcon({ size }) {
  // Figure-8 descender: two connected loops, the classic abseiling/belay device
  const c = '#00838F';
  const hole = '#E0F7FA'; // hollow centres of each loop
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      {/* Top (smaller) loop */}
      <rect x="5" y="1" width="6" height="2" fill={c}/>
      <rect x="3" y="3" width="2" height="4" fill={c}/>
      <rect x="11" y="3" width="2" height="4" fill={c}/>
      <rect x="5" y="7" width="6" height="2" fill={c}/>
      <rect x="4" y="3" width="8" height="4" fill={c}/>
      <rect x="5" y="4" width="6" height="2" fill={hole}/>
      {/* Bottom (larger) loop */}
      <rect x="4" y="9" width="8" height="2" fill={c}/>
      <rect x="2" y="11" width="2" height="3" fill={c}/>
      <rect x="12" y="11" width="2" height="3" fill={c}/>
      <rect x="4" y="14" width="8" height="1" fill={c}/>
      <rect x="4" y="11" width="8" height="3" fill={c}/>
      <rect x="5" y="11" width="6" height="2" fill={hole}/>
    </svg>
  );
}

function DiamondIcon({ size }) {
  // Classic faceted gem diamond — crown at top, pavilion tapering to a point
  const dark = '#283593';
  const mid = '#3949AB';
  const light = '#7986CB'; // highlight facets on the crown
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="1" width="6" height="2" fill={mid}/>
      <rect x="3" y="3" width="10" height="2" fill={mid}/>
      <rect x="2" y="5" width="12" height="2" fill={light}/>
      <rect x="3" y="7" width="10" height="2" fill={mid}/>
      <rect x="4" y="9" width="8" height="2" fill={mid}/>
      <rect x="5" y="11" width="6" height="2" fill={dark}/>
      <rect x="6" y="13" width="4" height="2" fill={dark}/>
      <rect x="7" y="15" width="2" height="1" fill={dark}/>
      <rect x="4" y="3" width="3" height="2" fill={light}/>
      <rect x="9" y="3" width="3" height="2" fill={light}/>
    </svg>
  );
}

function EmeraldIcon({ size }) {
  // Emerald-cut gem: rectangular octagonal outline with facet shading
  const dark = '#1B5E20';
  const mid = '#2E7D32';
  const light = '#66BB6A';
  const table = '#A5D6A7'; // the large flat face of an emerald cut
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="1" width="8" height="2" fill={mid}/>
      <rect x="2" y="3" width="12" height="8" fill={mid}/>
      <rect x="4" y="11" width="8" height="2" fill={mid}/>
      {/* Corner cuts make it octagonal */}
      <rect x="3" y="2" width="1" height="1" fill={mid}/>
      <rect x="12" y="2" width="1" height="1" fill={mid}/>
      <rect x="3" y="11" width="1" height="1" fill={mid}/>
      <rect x="12" y="11" width="1" height="1" fill={mid}/>
      <rect x="5" y="3" width="6" height="6" fill={table}/>
      {/* Side facets — darker left side, lighter right to imply depth */}
      <rect x="3" y="5" width="2" height="4" fill={light}/>
      <rect x="11" y="5" width="2" height="4" fill={dark}/>
      <rect x="5" y="9" width="6" height="2" fill={light}/>
    </svg>
  );
}

function MastersIcon({ size }) {
  // Crown: three points with gem inlays — classic rank symbol
  const c = '#7B1FA2';
  const gem = '#CE93D8'; // gem stones set into the crown band
  const base = '#6A1B9A'; // slightly darker base band
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      {/* Three crown points */}
      <rect x="1" y="4" width="2" height="8" fill={c}/>
      <rect x="7" y="2" width="2" height="8" fill={c}/>
      <rect x="13" y="4" width="2" height="8" fill={c}/>
      {/* Infill between points */}
      <rect x="3" y="6" width="4" height="6" fill={c}/>
      <rect x="9" y="6" width="4" height="6" fill={c}/>
      {/* Crown base band */}
      <rect x="1" y="10" width="14" height="4" fill={base}/>
      <rect x="1" y="11" width="14" height="2" fill={c}/>
      {/* Gem stones */}
      <rect x="2" y="12" width="2" height="2" fill={gem}/>
      <rect x="7" y="12" width="2" height="2" fill={gem}/>
      <rect x="12" y="12" width="2" height="2" fill={gem}/>
    </svg>
  );
}

function MagnusIcon({ size }) {
  // Mountain peak with flag — represents elite status at the top of the gym.
  // Named after Magnus Midtbø, the top 20 climbers per gym earn this rank.
  const rock = '#C62828';
  const snow = '#FFCDD2'; // snow cap at the peak
  const flag = '#FFD54F'; // gold flag planted at the summit
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      {/* Flag pole and flag */}
      <rect x="8" y="1" width="1" height="5" fill={flag}/>
      <rect x="9" y="1" width="3" height="3" fill={flag}/>
      {/* Snow cap */}
      <rect x="7" y="4" width="3" height="2" fill={snow}/>
      {/* Mountain body — pyramid shape built with progressively wider rows */}
      <rect x="5" y="6" width="7" height="2" fill={rock}/>
      <rect x="5" y="6" width="7" height="1" fill={snow}/>
      <rect x="3" y="8" width="11" height="2" fill={rock}/>
      <rect x="1" y="10" width="14" height="5" fill={rock}/>
      <rect x="4" y="10" width="2" height="3" fill="#B71C1C"/>
      <rect x="10" y="10" width="2" height="3" fill="#B71C1C"/>
    </svg>
  );
}

// ─── Public components ─────────────────────────────────────────────────────────

// Dispatcher that selects the correct SVG component by rank name.
// Keeping icon rendering in one place means adding a new rank only requires
// a new icon function and one entry here — no changes in consuming components.
function RankIcon({ name, size = 20 }) {
  switch (name) {
    case 'Iron':     return <IronIcon size={size}/>;
    case 'Bronze':   return <BronzeIcon size={size}/>;
    case 'Silver':   return <SilverIcon size={size}/>;
    case 'Gold':     return <GoldIcon size={size}/>;
    case 'Platinum': return <PlatinumIcon size={size}/>;
    case 'Diamond':  return <DiamondIcon size={size}/>;
    case 'Emerald':  return <EmeraldIcon size={size}/>;
    case 'Masters':  return <MastersIcon size={size}/>;
    case 'Magnus':   return <MagnusIcon size={size}/>;
    default:         return null;
  }
}

// Renders a coloured pill badge with the pixel-art icon and rank name.
// showName=false gives a compact icon-only version for tight spaces (e.g.
// leaderboard rows). iconSize controls the SVG dimensions independently of
// the badge's text size.
export function RankBadge({ rank, showName = true, iconSize = 16 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 8, background: rank.bg }}>
      <RankIcon name={rank.name} size={iconSize} />
      {showName && (
        <span style={{ fontFamily: '"Mulish", system-ui, sans-serif', fontSize: 11.5, fontWeight: 700, color: rank.color }}>
          {rank.name}
        </span>
      )}
    </span>
  );
}

export { RankIcon };
