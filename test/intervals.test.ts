import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// interval generator that works on a small range so that testing is more effective.
const point = fc.integer({ min: -10, max: 10 });
const interval: fc.Arbitrary<Interval> = fc
  .tuple(point, point)
  .map(([a, b]): Interval => (a <= b ? [a, b] : [b, a]));
const randomList = fc.array(interval, { maxLength: 12 });

// Chained generator each -  interval starts exactly at the previous end (touch),
// after a gap, or inside the previous interval (overlap) 
const chainedList: fc.Arbitrary<Interval[]> = fc
  .array(
    fc.tuple(
      fc.constantFrom('touch', 'gap', 'overlap'),
      fc.integer({ min: 0, max: 4 }),
      fc.integer({ min: 0, max: 4 })
    ),
    { maxLength: 12 }
  )
  .map(steps => {
    const out: Interval[] = [];
    let prevEnd = 0;
    for (const [kind, offset, len] of steps) {
      const start =
        kind === 'touch' ? prevEnd : kind === 'gap' ? prevEnd + 1 + offset : prevEnd - offset;
      out.push([start, start + len]);
      prevEnd = start + len;
    }
    return out;
  });

// Mix of fully random lists and chained lists.
const intervalList = fc.oneof(randomList, chainedList);

// Targeted generator for the conditional test: sorted intervals with a gap of
// at least 1 between them
const disjointSortedList: fc.Arbitrary<Interval[]> = fc
  .tuple(
    fc.integer({ min: -10, max: 10 }),
    fc.array(
      fc.tuple(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 5 })),
      { maxLength: 8 }
    )
  )
  .map(([first, steps]) => {
    const out: Interval[] = [];
    let prevEnd = first - 1;
    for (const [gap, len] of steps) {
      const start = prevEnd + gap;
      out.push([start, start + len]);
      prevEnd = start + len;
    }
    return out;
  });

// helper oracle - is point p covered by this list?
const covers = (xs: readonly Interval[], p: number) =>
  xs.some(([s, e]) => s <= p && p <= e);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      })
    );
  });

  // Pattern: invariant. The output length is less than or equal to the input length.
  it('output length is less than or equal to the input length', () => {
    fc.assert(fc.property(intervalList, xs => {
      const out = mergeIntervals(xs);
      expect(out.length).toBeLessThanOrEqual(xs.length);
    }))
  });

  // Pattern: conditional. If the input is already sorted with no overlapping or touching intervals, the result equals the input but is a new list.
  it('leaves already-disjoint input unchanged, as a new list', () => {
    fc.assert(
      fc.property(disjointSortedList, xs => {
        const out = mergeIntervals(xs);
        expect(out).toEqual(xs);
        expect(out).not.toBe(xs);
      })
    );
  });

  // Pattern: metamorphic. Scrambling the input order does not change the merged output.
  it('is unchanged by shuffling the input', () => {
    const listAndShuffle = intervalList.chain(xs =>
      fc
        .shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })
        .map(ys => [xs, ys] as const)
    );
    fc.assert(
      fc.property(listAndShuffle, ([xs, ys]) => {
        expect(mergeIntervals(ys)).toEqual(mergeIntervals(xs));
      })
    );
  });

  // Pattern: differential. A point p is covered by the output exactly when the simple coverage check says it is covered by the input.
  it('covers the same points as the input', () => {
    // Half-integers too, since the spec covers all real numbers (e.g. 2.5 in the gap between [1,2] and [3,4]).
    const p = fc.integer({ min: -24, max: 24 }).map(n => n / 2);
    fc.assert(
      fc.property(intervalList, p, (xs, pt) => {
        expect(covers(mergeIntervals(xs), pt)).toBe(covers(xs, pt));
      })
    );
  });

  // Pattern: algebraic. Merging is associative - merging (A u B) u C equals merging A u (B u C).
  it('is associative over concatenation', () => {
    fc.assert(
      fc.property(intervalList, intervalList, intervalList, (a, b, c) => {
        const left = mergeIntervals([...mergeIntervals([...a, ...b]), ...c]);
        const right = mergeIntervals([...a, ...mergeIntervals([...b, ...c])]);
        expect(left).toEqual(right);
      })
    );
  });
});
