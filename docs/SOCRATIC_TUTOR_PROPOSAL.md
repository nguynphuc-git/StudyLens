# Socratic tutoring in Mathfolio — proposal for discussion

Status: deferred research and proposed product behavior only; retained while shared-input, layout and illustration support are refined. No Socratic tutoring behavior is enabled. Current prompts and consent separately support selected problem illustrations.

## What Jane Street provides

The upstream [socratic-tutor/SKILL.md](https://github.com/janestreet/agent_skills/blob/master/socratic-tutor/SKILL.md) is a behavioral instruction document for an existing language model. It describes opt-in ongoing teaching: diagnostic questions, a map of subskills scored 0–5, one question per turn, follow-up questions to expose misconceptions, review and a final assessment. It is not a new mathematical model, OCR system or correctness verifier. The source explicitly distinguishes ongoing tutoring from a quick factual question.

The repository uses the [MIT license](https://github.com/janestreet/agent_skills/blob/master/LICENSE.md). A future implementation that copies or substantially adapts its prompt should retain the original copyright and permission notice. No upstream prompt is copied into the app by this proposal.

## Recommended first experiment: one exercise

Keep the current question/answer discussion and add an explicit **Learn step by step** option in the chat panel. This choice is independent of **Local AI / Cloud AI**. It receives the current problem and the learner's typed answer; it should follow the current selected-problem-illustration and cloud permission boundaries. Notes and solution images remain excluded.

An initial question asks what the learner has tried or targets a prerequisite for that exact exercise. The tutor then asks one focused question, waits, checks the response and adapts. A wrong response leads to a narrower question; repeated difficulty can lead to a short explanation and a fresh check. The learner can pause, request a direct explanation or use the existing hint controls. Unlocked hints are not hidden or reset by changing discussion style.

Example for a quadratic exercise:

1. Tutor asks which standard form is needed to use the quadratic formula.
2. Learner rewrites the equation.
3. Tutor checks that step, then asks the learner to identify the coefficients.
4. Later questions check the discriminant and why a proposed root satisfies the original equation.

The first experiment should not require a multi-question course diagnostic before someone can work on one exercise.

## Persistence and model requests

The app currently sends a small slice of chat history, particularly for local inference. Pasting the entire SKILL.md into every turn cannot provide reliable long-term memory by itself. A future implementation should persist a compact, versioned tutor state alongside the exercise: current concept, stage, last question, attempts, observed misconceptions and a short summary. Topic-wide skill maps can follow after the single-exercise flow is useful.

Only the minimal state needed for the next question should accompany a short tutoring prompt. Local mode can run short questions on a supported device; its grading and proof reasoning must be evaluated rather than assumed. Cloud mode retains explicit permission and existing input boundaries. Neither route becomes mathematically reliable merely by using this skill.

Validate any structured model updates before storing them. Stop/cancel should discard both the new response and its proposed state changes. Workspace changes stay separate from the library until Save, including tutor progress. Treat progress levels as estimates supported by observed answers, not as a certified grade. Opening hints or checking Completed must not count as evidence of independent mastery.

## Later option: learn a topic across exercises

If users want an ongoing course, introduce a separate opt-in session with diagnostic placement, a visual skill map, evidence-backed progress and a review queue. Save state per account/topic and let the learner change focus. Review can be offered when the notebook is opened; actual scheduled reminders would be a separate user choice.

## Acceptance checks before enabling a pilot

Use representative examples: a linear equation, a quadratic, a Cauchy-sequence proof, an incomplete problem and a convincingly wrong student answer. Check that each turn has one question, does not leak later answers, accepts alternative valid approaches and says when uncertain. Verify the direct-answer escape, source consent, offline behavior, cancellation rollback and save/reload of the session. Compare local and cloud behavior on supported hardware.
