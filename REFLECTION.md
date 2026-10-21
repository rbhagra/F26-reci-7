# Reflection

Rohan Bhagra / rbhagra

**Recitation group members (Task 2):**

Ashley Leung 

### 1. Valid but weak

This property passes on the correct implementation of wordle but doesn't catch too many bugs. Pattern: conditional. If guess and secret share no letters, every color is black. This doesn't catch many bugs because it simply tests the core logic of the worlde implementation - that a letter is marked at black if it doesn't match anything in the secret. It is unlikely that there would be bugs in this part of the implementation. It would catch the bug if, for example, we do not check if the letter is anywhere in the secret but only check the place-wise presence. 


### 2. A generator problem, not a property problem

From the intervals task, the aliasesInput mutant. This mutant tests that when two intervals simply touch, we do not merge them. The generator failed to produce inputs where there was a sufficent amount of intervals touching, which is what this test was designed to evaluate. To fix it, I implemented a chainedlist generator that produces inputs that are pairwise touching so that we can test this property properly. 

Before:  ~ touchingNotMerged       flaky: killed in 3/5 runs  by: is unchanged by shuffling the input
      Counterexample: [[[[-7,0],[-7,-7]],[[-7,-7],[-7,0]]]]
      AssertionError: expected [ [ -7, -7 ], [ -7, +0 ] ] to deeply equal [ [ -7, +0 ] ]

After: 
  ✔ touchingNotMerged       killed  by: returns intervals with a strict gap between them; is unchanged by shuffling the input
      Counterexample: [[[0,7],[7,7]]]
      AssertionError: expected 7 to be less than 7

### 3. Reading a counterexample


  ✔ allBlack       killed  by: is green exactly where guess and secret agree; guessing the secret gives all greens
      Counterexample: ["AAAAA","AAAAA"]
      AssertionError: expected false to be true // Object.is equality
    
Both the input and the output ("AAAAA") agree on every position. Based on the spec, since guess[i] === secret[i] for all i, green should be returned for every position. However, the buggy AllBlack version returns black for all positions, exposing the bug. 

### 4. Your project:

One function in our project 2 that would benefit from property-based testing is the withAction function in the always allow feature. 

Pattern 1: Invariant. When a permission is set, we should be able to read it back and recieve whatever was set.  We need three generators for this test. One generator needs to generate a permission, and the second generator would need to choose a tool from the TOOLS string to apply the permission to. Our third generator would need to generate all 3 possible artificats that the function can take in (per tool, global, or undefined) based on the permission generated previously. A naive generator would only pass in a string, and thus ignore the undefined or global paths.

Pattern 2: Algebraic. Passing allow for all objects via the function versus a global allow should map to the same permissions state. We need the first two generators from the previous pattern for this pattern. A naive generator would only pass in allow instead of don't allow, which wouldn't allow us to test this property properly. 

