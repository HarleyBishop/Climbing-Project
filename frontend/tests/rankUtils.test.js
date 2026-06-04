/**
 * Tests for rankUtils.jsx — the rank calculation logic.
 *
 * These are pure function tests: no DOM, no API calls, no rendering.
 * Because getRank and calculatePoints are exported JavaScript functions,
 * we can call them directly and verify their output.
 *
 * Run with: npm test (inside frontend/)
 */
import { describe, it, expect } from 'vitest';
import { getRank, calculatePoints, RANKS, MAGNUS_RANK } from '../src/utils/rankUtils.jsx';


// ─── getRank ──────────────────────────────────────────────────────────────────
// getRank(points, position) returns a rank object with { name, color, bg }.
// It has two modes:
//   - position <= 20 → always returns MAGNUS_RANK (top 20 per gym)
//   - otherwise     → selects based on points threshold from RANKS array

describe('getRank — points-based rank selection', () => {

  it('returns Iron at 0 points (the floor rank)', () => {
    expect(getRank(0).name).toBe('Iron');
  });

  it('returns Iron just below the Bronze threshold', () => {
    // Bronze requires 100 pts; 99 should still be Iron.
    expect(getRank(99).name).toBe('Iron');
  });

  it('returns Bronze at exactly the Bronze threshold', () => {
    expect(getRank(100).name).toBe('Bronze');
  });

  it('returns Silver at 300 points', () => {
    expect(getRank(300).name).toBe('Silver');
  });

  it('returns Gold at 700 points', () => {
    expect(getRank(700).name).toBe('Gold');
  });

  it('returns Platinum at 1200 points', () => {
    expect(getRank(1200).name).toBe('Platinum');
  });

  it('returns Diamond at 2000 points', () => {
    expect(getRank(2000).name).toBe('Diamond');
  });

  it('returns Emerald at 3000 points', () => {
    expect(getRank(3000).name).toBe('Emerald');
  });

  it('returns Masters at 4500 points (the highest threshold)', () => {
    expect(getRank(4500).name).toBe('Masters');
  });

  it('returns Masters for very high points beyond the cap', () => {
    expect(getRank(99999).name).toBe('Masters');
  });

  it('defaults position to null and uses points', () => {
    // Calling without a position argument should not throw or return Magnus.
    const rank = getRank(500);
    expect(rank.name).not.toBe('Magnus');
    expect(rank.name).toBe('Silver');
  });
});


describe('getRank — Magnus (positional override)', () => {

  it('returns Magnus for position 1 regardless of points', () => {
    // Even 0 points gets Magnus if you're #1 on the gym board.
    expect(getRank(0, 1).name).toBe('Magnus');
  });

  it('returns Magnus for position 20', () => {
    expect(getRank(0, 20).name).toBe('Magnus');
  });

  it('does NOT return Magnus for position 21', () => {
    // Just outside the top-20 cutoff — falls through to points.
    expect(getRank(0, 21).name).toBe('Iron');
  });

  it('Magnus rank has the expected name and color from MAGNUS_RANK constant', () => {
    const result = getRank(100, 5);
    expect(result.name).toBe(MAGNUS_RANK.name);
    expect(result.color).toBe(MAGNUS_RANK.color);
  });
});


// ─── calculatePoints ─────────────────────────────────────────────────────────
// calculatePoints(sends) takes the SendSerializer response shape and returns
// total points, filtering out archived climbs.
//
// The grade-to-points mapping MUST match the backend's grade_to_points() in
// views.py. These tests verify the critical boundary values in that mapping.

describe('calculatePoints — grade boundaries', () => {

  function makeSend(grade, archived = false) {
    return { climb_grade: grade, climb_is_archived: archived };
  }

  it('returns 10 points for a V0 send', () => {
    expect(calculatePoints([makeSend(0)])).toBe(10);
  });

  it('returns 10 points for a V2 send (top of first tier)', () => {
    expect(calculatePoints([makeSend(2)])).toBe(10);
  });

  it('returns 20 points for a V3 send (start of second tier)', () => {
    expect(calculatePoints([makeSend(3)])).toBe(20);
  });

  it('returns 40 points for a V5 send', () => {
    expect(calculatePoints([makeSend(5)])).toBe(40);
  });

  it('returns 70 points for a V7 send', () => {
    expect(calculatePoints([makeSend(7)])).toBe(70);
  });

  it('returns 100 points for a V9 send', () => {
    expect(calculatePoints([makeSend(9)])).toBe(100);
  });

  it('returns 150 points for a V11 send (elite tier)', () => {
    expect(calculatePoints([makeSend(11)])).toBe(150);
  });

  it('returns 0 for an empty sends array', () => {
    expect(calculatePoints([])).toBe(0);
  });
});


describe('calculatePoints — archived climb filtering', () => {

  function makeSend(grade, archived = false) {
    return { climb_grade: grade, climb_is_archived: archived };
  }

  it('excludes archived sends from the total', () => {
    const sends = [
      makeSend(7, false),  // 70 pts
      makeSend(7, true),   // archived → 0 pts
    ];
    expect(calculatePoints(sends)).toBe(70);
  });

  it('returns 0 when all sends are archived', () => {
    const sends = [makeSend(5, true), makeSend(8, true)];
    expect(calculatePoints(sends)).toBe(0);
  });

  it('accumulates points correctly across multiple active sends', () => {
    const sends = [
      makeSend(5, false),  // 40 pts
      makeSend(7, false),  // 70 pts
      makeSend(9, false),  // 100 pts
    ];
    expect(calculatePoints(sends)).toBe(210);
  });

  it('accumulates correctly with mixed archived and active', () => {
    const sends = [
      makeSend(5, false),  // 40 pts — counts
      makeSend(8, true),   // 70 pts — archived, ignored
      makeSend(3, false),  // 20 pts — counts
    ];
    expect(calculatePoints(sends)).toBe(60);
  });
});


// ─── RANKS array structure ────────────────────────────────────────────────────
// Sanity-check the RANKS constant itself so typos in thresholds are caught early.

describe('RANKS constant structure', () => {

  it('has 8 rank tiers', () => {
    expect(RANKS).toHaveLength(8);
  });

  it('is sorted by ascending min threshold', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min);
    }
  });

  it('Iron starts at 0 (the floor)', () => {
    expect(RANKS[0].name).toBe('Iron');
    expect(RANKS[0].min).toBe(0);
  });

  it('Masters is the highest tier', () => {
    const masters = RANKS[RANKS.length - 1];
    expect(masters.name).toBe('Masters');
  });
});
