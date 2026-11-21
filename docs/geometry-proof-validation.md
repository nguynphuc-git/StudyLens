# Geometry proof validation

The geometry workspace accepts a reviewed PDF/image problem or pasted text/LaTeX, then builds a declarative diagram from the hypotheses. Green lines represent given objects. Violet lines represent optional auxiliary constructions, initially hidden and revealed with hint level 2 or the explicit toggle. Visible lines of either color are solid. Only occluded portions are dashed. Spatial scenes use 3D coordinates and adjustable viewing angles; face-based occlusion is recalculated when the view changes, including partially hidden edges and circles. Legacy spatial scenes without faces retain explicit hidden-edge flags; newly generated spatial scenes should include their boundary faces.

Users enter or upload problems directly in Problem; there is no sample gallery. Recognized problems can use exact local constructions without model initialization, including IMO 1970 P5. Its full published wording (including flattened PDF superscripts) and the supplied English/LaTeX paraphrases are recognized conservatively; changed hypotheses and additional conditions still go to AI. Other problems use the selected AI route. Cloud requests require explicit Cloud AI consent. Invalid geometry in a schema-valid response gets at most one correction attempt on the same route, with the original problem and selected illustrations. Corrections must preserve the givens, goal, given objects and every declared relation; otherwise they are rejected. Malformed scenes and truncated responses are rejected directly. Editing the problem or changing its illustrations invalidates the existing diagram.

## Sourced contest cases

Inputs are paraphrased in `tests/fixtures/geometry-contests.ts` with source links.

| Case | Source | Checks |
| --- | --- | --- |
| IMO 1968, problem 4 | [Official problem paper](https://www.imo-official.org/assets/documents/problems/1968/1968_eng.pdf) | Spatial existence proof remains a proof task after LaTeX conversion; an irregular tetrahedron sanity check; no regularity assumption. |
| IMO 1970, problem 5 | [Official problem paper](https://www.imo-official.org/assets/documents/problems/1970/1970_eng.pdf) | Plane projection, orthocenter and perpendicularity constraints; unequal-axis and equality configurations; invalid configurations rejected. |
| ASMO 2022 International Round, Secondary, problem 25 | [Organizer's sample paper](https://drive.google.com/file/d/1K4iV1-ueLUCpTjMdWUqAZ-0hqmuRudaP/view), linked from the [organizer's ASMO page](https://globalolympiadsacademy.com/asmo/) | Right trapezoid, midpoint, line intersection and published ratio 10. This is a **plane geometry** comparison case, not a spatial proof problem. |

The regression scenes are human-authored fixtures. IMO 1970 P5 additionally exercises the production generation API using the exact text reported by the user and its editor conversion, independently checking the right angle, plane projection and all three altitudes. The supplied IMO 2019 P2 statement also has an exact local construction: Q is constructed as the intersection of BB1 with the parallel to AB through P, while P1 and Q1 use angle-constrained rays. Tests cover segment betweenness, both angle conditions, LaTeX subscripts and independent numerical concyclicity checks. No target circle is assumed. Passing these tests validates the construction engine and input pipeline; it does not show that a model independently solved those contest problems. Numerical checks of a few configurations are not proofs.

For other inputs, the interpreter can use dependent line points, intersections with parallel lines and angle-constrained rays. Before requesting model correction, local incidence repair can replace guessed free coordinates with these constructions while retaining all declared hypotheses. Bounded recovery of coincident endpoints and degenerate intersections is accepted only if the entire scene passes validation. These repairs do not certify hypotheses omitted by the interpreter.

Internal incenters and angle-bisector intersections with the opposite side are supported as dependent constructions in any triangle plane. Fixed-angle relations include a numeric degree value, which is validated and must survive any repair unchanged. The supplied isosceles ABC / incenter K of ADC / angle BEK = 45° problem has a conservative full-statement local path, including the PDF's broken angle glyph and LaTeX degree notation. The displayed diagram is one admissible configuration, not a claim to enumerate all solutions. Independent tests verify both the 60° and 90° apex configurations, including internal K, both original bisectors and the 45° angle; an arbitrary different triangle is rejected. Changed hypotheses still go through the interpreter.

## Proof review criteria

- IMO 1968 P4: let AB be a longest edge. If the incident lengths at both A and B fail the strict triangle inequalities, then AB >= AC + AD and AB >= BC + BD. Adding the strict face inequalities AC + BC > AB and AD + BD > AB gives a contradiction. No regularity assumption is needed.
- IMO 1970 P5: first derive pairwise perpendicularity of DA, DB and DC from the projection/orthocenter hypotheses. Then apply Cauchy to AB + BC + CA and Pythagoras to the three face edges. Equality occurs when DA = DB = DC. A drawing or measured values cannot replace these steps.
- Auxiliary objects must be justified constructions, never extra assumptions. A target circle must not appear as a given when concyclicity is what must be proved.

## Test coverage and limits

- Unit tests cover exact tangency, circle and line intersections, circumcenters, plane projection, relation validation, malformed model output and persistence.
- UI tests cover source pasting, reviewed PDF import, explicit diagram generation, hint context, auxiliary reveal, stale diagram invalidation and cancellation.
- AI boundary tests cover local routing, uploaded image input, explicit cloud consent, malformed/truncated output, input-capacity errors and cancellation. These tests mock inference.
- On 17 November 2026, a direct local attempt for IMO 1970 P5 in the integrated Chromium browser returned `QuotaExceededError`. A separate minimal native prompt confirmed that this browser only exposes Chromium's echo implementation: “On-device model is not available in Chromium”. No live local-model proof benchmark passed in this environment. Test the actual model in supported Chrome before relying on its extraction or hints.
- The scene validator checks relations declared in the scene. It cannot prove that AI extracted every hypothesis correctly; the interface asks the learner to review the extracted givens and explicitly displays unresolved assumptions.
- Circles currently lie in planes parallel to the xy plane. Arbitrarily oriented spatial circles and unsupported loci must be reported as unresolved. A diagram is illustrative, not a symbolic proof certificate.

Run `npm test` and `npm run build`. For manual Chrome testing, open the local development URL, paste one problem into Problem, click **Create diagram**, review **Given** and **To prove**, then request hint levels 1 and 2. For a spatial problem, rotate and tilt the view. Modify the statement and confirm that the old diagram is removed before generating a replacement.
