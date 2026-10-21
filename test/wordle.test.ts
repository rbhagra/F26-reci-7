import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SMALL = 'ABC';

const wordFrom = (letters: string) =>
  fc
    .array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 })
    .map(cs => cs.join(''));

const word = wordFrom(ALPHABET);       
const smallWord = wordFrom(SMALL);    
// mix the two 
const anyWord = fc.oneof(word, smallWord);

const count = (w: string, letter: string) =>
  [...w].filter(c => c === letter).length;

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      })
    );
  });

  // Pattern: invariant. Every color is one of G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) {
          expect(['G', 'Y', 'B']).toContain(c);
        }
      })
    );
  });

 // Pattern: conditional. If guess and secret share no letters, every color is black.
it('gives  blacks when the words share no letters', () => {
  fc.assert(
    fc.property(
      wordFrom('ABCDEFGHIJKLM'),
      wordFrom('NOPQRSTUVWXYZ'),
      (secret, guess) => {
        expect(matchGuess(secret, guess)).toEqual(['B', 'B', 'B', 'B', 'B']);
      }
    )
  );
});

  // Pattern: invariant. A position is green exactly when the letters match there.
  it('is green exactly where guess and secret agree', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (let i = 0; i < 5; i++) {
          expect(result[i] === 'G').toBe(guess[i] === secret[i]);
        }
      })
    );
  });

  // Pattern: conditional. If the guess equals the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(anyWord, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      })
    );
  });

  // Pattern: metamorphic. Reordering positions the same way in both words
  // reorders the colors the same way.
  it('commutes with applying the same position permutation to both words', () => {
    fc.assert(
      fc.property(
        anyWord,
        anyWord,
        fc.shuffledSubarray([0, 1, 2, 3, 4], { minLength: 5, maxLength: 5 }),
        (s, g, perm) => {
          const permute = <T,>(xs: ArrayLike<T>) => perm.map(i => xs[i]);
          const ps = permute([...s]).join('');
          const pg = permute([...g]).join('');
          const base = matchGuess(s, g).map(c => c === 'G');
          expect(matchGuess(ps, pg).map(c => c === 'G')).toEqual(permute(base));
        }
      )
    );
  });
});
