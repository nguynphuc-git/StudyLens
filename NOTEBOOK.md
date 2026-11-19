## Image review and reliable extraction restore

- Image import prioritizes the green **Read printed text** button for bundled, device-local OCR. The secondary **Read with AI** group selects Local AI (default) or Cloud AI. Local image AI retains its browser OCR fallback; Cloud never runs as an implicit fallback. Each Cloud image request asks for consent for that source image, enabling session permission if needed. No notes, chat or other attachments accompany the transcription. Stop and close abort the request and reject late output; declining or failing keeps the review.
- The source opens the zoom/pan viewer without losing edits or closing the import. **Review your problem** is now one directly editable MathInput, with manual Text/Math modes, Alt/Option switching, multiline formulas and the shared symbol keyboard. Edited LaTeX is imported without reparsing it as prose. Formula cropping and optional source-image retention remain available. The footer, headings and editor follow the selected light/dark theme.
- **Restore extracted text** resets the native MathLive field even when its content has changed without a matching React state update. It preserves the chosen typing mode and reports the restore. PDF restores the selected question's extraction; image review restores its latest successful transcription. Restore does not correct OCR errors.
- Regression checks cover printed/local/cloud routing, consent denial and grant with Cloud off, offline failure, edit/restore/apply, source viewer isolation, cancellation and late results. Native Chromium checks use controlled model/auth/source fixtures to verify real MathLive edits and restore (including unsynchronized content), source zoom, dark contrast, mobile layout and exact edited-formula import. Live device-model quality and Cloud transcription accuracy still require source-document review.

## Math spaces, explicit study routes and multi-question PDF review

- Space uses MathLive's native math-space option: it inserts a visible gap while retaining Math mode, cursor structure and undo. Text typing, Alt/Option switching, chords, composition and read-only guards retain their existing behavior.
- Knowledge and hint 1 each have a Local AI / Cloud AI selector. Both default to Local; choosing Cloud asks for session permission if needed and does not generate an answer until Analyze/Refresh or Open level 1 is pressed. Switching Cloud AI off resets these selections and chat to Local. An explicitly chosen cloud analysis bypasses local formula shortcuts; hint 1 may use cloud with permission, including worksheet batches and illustrations. This supersedes the earlier always-local first-hint policy. Existing generated hints remain intact; Reset hints regenerates them with the chosen route.
- PDF import selects questions with checkboxes across pages. The PDF page control (plus Previous/Next) changes both the source image and the questions shown. Search and Select all shown apply to that page; previous selections and edits stay intact. Each selected question has a formatted editable MathInput, source restore and access to the shared symbol palette.
- Selected questions are combined in document order as one worksheet, preserving edited TeX and original question headings. The combined 6,000-character limit is enforced before import; no question is silently truncated. Replacing existing problem context asks for confirmation and retains notes/attachments.
- The import dialog has one vertical scroll area for Questions found, the source and every editor. Source occupies less horizontal space than the review column; images and editors expand naturally. Clicking the source opens the existing zoom/pan viewer, with a PDF source label. Escape closes only that viewer and preserves the review below it.
- PDF Cloud reading always asks before sending the current page. With Cloud off, confirmation explicitly enables the session and reads that page. Confirmations now appear above PDF/viewer layers with the underlying dialog inert and dark text contrast corrected. Manual edits on the page being replaced are disclosed before sending. Other pages are retained; recognized text is split into formatted questions for review. Stop, close and account changes abort the operation or reject late results; errors are shown within the PDF dialog.

Validation includes explicit route/consent boundaries, cloud first-hint worksheet coverage, selected illustrations, cloud-only image requests with AbortSignal, multi-page selection/edits/order, formatted symbols, limits, replacement and image-viewer isolation. Headless Chromium checks real Space key events, route choices, visible clickable consent above PDF, source zoom, single-scroll geometry, formatted editors, cancellation and combined import on desktop/mobile using controlled auth/model/PDF fixtures. These checks do not establish live model transcription or mathematical accuracy. Socratic tutoring remains deferred.

## Independent chat, library completion and dark import/progress states

- Chat and notes are available without running knowledge or hints. A question-only chat is accepted without a problem statement; analysis and hints still require a problem, and hints retain their ordered prerequisites. Chat uses any existing problem/context without confirming the problem or opening hint levels. Cloud consent, selected illustrations and cancellation guards remain active.
- Library cards offer Mark completed / Mark in progress. Only completion and the update timestamp are patched on the single shared saved record. Filters update immediately after successful storage. Matching workspace completion follows the explicit library action without overwriting unsaved notes or other work; a failed save leaves the displayed and stored status intact.
- Illustration thumbnails retain zoom, rename, remove and AI-context selection. Per-illustration Read locally / Read with Cloud AI actions were removed; Add content → Read image and separately consented PDF reading remain available.
- AI/diagram/import progress banners, streaming text, PDF action footers, replacement prompts, selected questions and PDF headings have explicit dark colors. Source image pixels are preserved. The PDF question list grows from a 25dvh/250px maximum to 38dvh/420px on desktop, with a 38dvh limit on smaller screens; the rest of the dialog remains scrollable.

Validation covers question-only and unanalyzed chat, notes preservation, consent/Stop boundaries, completion toggling/reload/filtering, failed-save retry, shared-record isolation and unsaved workspace preservation. Browser checks use controlled auth/AI/PDF fixtures; they validate real page controls and styling without live authentication or inference.

## Mixed Math paste, fraction focus and edge-to-edge sign-in decoration

- Math mode accepts pasted prose alongside formulas, retaining paragraph breaks and recovering exact TeX from annotated KaTeX/MathML clipboard HTML. Complete authored TeX environments retain their layout. Text mode keeps ordinary clipboard text literal; explicit LaTeX still takes precedence. Both modes remain selected after paste; live automatic mode detection stays disabled.
- The shared editor accepts annotated HTML even when a source omits text/plain. Clipboard HTML is converted to text/TeX, never inserted as DOM. Existing read-only, selection replacement and length guards remain active.
- Dark MathLive fields set the public contains-highlight variables as well as ordinary selection colors. This fixes the pale fraction/parent focus highlight when the app uses Dark while the OS uses Light, across Problem, Notes and Chat.
- The fixed body-level login layer fills the viewport with soft edge gradients. Signed-out pages drop the unused stable scrollbar gutter, and the right halo reaches the edge. Drift cycles are now 16–36 seconds, with the same 20 symbols and reduced-motion behavior.

Validation includes mixed Vietnamese proof paste, raw/delimited TeX, arrays, annotated HTML with and without plain text, MIME precedence and mode retention. Headless Chromium checks exercise native Ctrl+V through the real MathInput component, confirm error-free fraction rendering and the dark focus color with an OS Light preference, and measure the actual sign-in backdrop at 1920, 1280 and 390 px plus reduced motion. Firebase sign-in and AI inference were not exercised in these visual checks.

## Compact Appearance, aligned controls and Alt/Option entry

- Fixed the remaining bright cloud-hint recommendation panels in dark mode, including their text/buttons. Folder color swatches, their current-color caption and disclosure summary are centered.
- The primary toolbar explicitly shares a grid row between Add content / Study options and the Save/New/Focus controls. Status stays above on the right and Cloud AI below. Smaller screens stack rows to keep controls reachable.
- Dropdown/disclosure arrows now use a centered SVG inside a stationary frame; only the inner arrow rotates. Appearance is narrower, choices are more compact and the reading-size slider is shorter with a thinner track/smaller thumb.
- Theme offers only Light and Dark. A legacy System preference resolves once on load to a concrete theme. Text alignment was removed from the controls and preference record; old alignment values are ignored and reading text is left-aligned. Other saved reader preferences retain their key and values.
- Login decoration is portalled to the body as a fixed, pointer-free viewport layer, escaping the page-width constraint. It uses 20 symbols (up from 16) and slightly shorter 20–44 second drift cycles. Reduced-motion preferences still stop animation.
- A bare Alt press/release switches the focused editor between Math and Text; Mac uses the equivalent Option (⌥) key. Preventing bare Alt's browser-menu default preserves editor focus. Alt combinations, AltGraph, composition, repeated keydowns and blur are guarded; Ctrl bare modifier tap no longer switches modes. The visible button remains available, with the same behavior in Problem, Notes and Chat.

Validation includes Windows-style Alt and Mac-style Option event sequences, modifier/AltGraph/composition/blur guards, disabled/read-only editors, no edits from mode switches, two-theme selection, legacy preference handling and full-viewport decorative portal cleanup. Physical browser appearance and OS shortcut behavior still need acceptance testing.

## Dark editors, temporary menus and the sign-in background

- The workspace toolbar separates content tools on the left from a right-aligned Exercise actions group: New exercise, Focus mode, Save exercise and the Cloud AI switch. Narrow layouts wrap while retaining right alignment of the action group.
- Dark mode now covers the shared MathLive surface/host used by Problem, Notes and Chat, including caret, selection, placeholders and composition. The editor surface is a lighter muted dark shade. More symbols, the notes keyboard toggle, the floating symbol drawer and its sticky header/categories also follow dark colors. Compact saved math keeps a transparent surface.
- Appearance, Study options and Add content are temporary disclosures: outside pointer/focus dismisses them, and Escape closes them with focus returned to their summary. The independent draggable math palette retains its explicit-close behavior.
- Appearance choices and Local answer style use a shared custom selection menu: rounded surface, selected pill/check, hover state, keyboard arrows/Home/End/typeahead, Enter selection, Escape cancellation and Tab dismissal. Fixed-position portalled options fit above or below their trigger and track viewport/scroll changes; selecting inside them does not dismiss the parent disclosure. Existing appearance preference keys and answer-style routing are preserved.
- The signed-out page has slow drifting mathematical symbols and soft background halos, with a translucent login card. The decoration is aria-hidden, ignores pointers, does not modify form data, and stops animating under prefers-reduced-motion. It is absent from the signed-in workspace and the usage guide.

Validation includes temporary-disclosure/portal boundaries, keyboard selection/cancellation, disabled and unmounted cleanup, appearance persistence, right-group structure, draft preservation, and unchanged login values during theme changes. Existing editor/keyboard and application regressions remain covered. Physical Chrome geometry, colors and animation feel remain visual acceptance items; a browser binary is not available in this workspace.

## Pastel folder colors and separated header

- Integrated upstream library/search, reader appearance and guided geometry changes before applying this update.
- Folders support six named pastel tokens: Sage, Sky, Lavender, Rose, Peach and Butter. Choose a color when creating a folder from the library or while saving an exercise, or expand Color on an existing folder card. My exercises can be recolored too.
- Colors are saved in the account-scoped notebook record only after storage succeeds. Recoloring does not change exercise IDs, memberships, content or update times. Old folders without a color use Sage without a migration/write on open; unsupported tokens also display that safe default.
- Folder cards and folder-selection dots use the selected color. Selected swatches have a check and accessible name/pressed state. Dark mode uses subdued matching card surfaces; colored text meets 4.5:1 contrast on all six light and dark surfaces (minimum measured 5.94:1).
- The header has a lightly colored surface, bottom border and rounded lower corners to separate navigation from the content. It follows blue/rose paper preferences and has dedicated dark surfaces. Responsive padding keeps the header aligned with page content. Dialogs stay above the header.

Validation covers color storage/immutability, legacy/invalid-token fallback, changing the history-folder color, folder creation/reload, failed-save retry without exercise changes, and color selection during exercise save. Physical Chrome visual acceptance still remains.

## History, shared folders and section-specific images

- My exercises is now the complete history of saved exercises, regardless of custom folder selection. Each exercise has one ID and one saved record. Optional folderIds holds custom memberships; legacy folderId records are interpreted without rewriting existing notebooks on open. New saves can select zero, one or several custom folders; a newly created folder is added alongside the selected folders.
- Library previews offer folder checkboxes and Save changes. Adding/removing a membership changes where the same exercise is listed, not a copy. Deleting an exercise confirms that it deletes the page and attachments from history and every folder. Deleting a custom folder only removes that membership; pages remain in history and other folders.
- Saved problem illustrations appear in the Problem section; solution attachments appear inside Your working notes. Solution images can be added or removed in the preview, and both image kinds can be renamed. Changing/removing problem illustrations still requires Open in workspace so its AI context is reset correctly. Existing zoom/pan viewing remains available.
- Preview notes, solution-image edits, image names and folder selections are staged together until Save changes. Closing with unsaved edits asks to discard; storage failures keep the edits for retry. A narrow patch preserves the problem, essentials, hints and conversation. Matching workspace fields follow saved preview edits while independent workspace changes are kept.
- Online, unopened hint 2/3 levels suggest Use Cloud AI. Clicking asks for cloud consent and starts that level only after approval; cancellation sends nothing. Open level continues to use the current permission setting, and offline uses local. Hint 1 always stays on-device.
- The four-image total and 3 MB per-upload limits remain. Solution images are not sent to AI. Names are display metadata; renaming does not change image bytes or regenerate tutoring.

Validation includes legacy and multi-folder history, one-record updates, folder deletion preservation, preview patch isolation and problem-image protection, image placement/rename/upload/remove/reopen, unsaved changes and failed-save retry, workspace field isolation, shared deletion, and online cloud suggestions/consent/offline routes. Tests use simulated DOM and mocked model responses; physical browser layout remains an acceptance-test item.

## Complete worksheet hints and readability

- Hint 1 is always ONLY_ON_DEVICE, including diagrams and sessions with Cloud AI enabled. The API normalizes stale cloud callers to local before choosing a model or prompt. It does not claim a special hardware/power setting: local reasoning capability remains that of the installed model.
- Hint prompts cover every exercise and lettered subpart in text and images, with concise per-part budgets instead of one global hint/word limit. They request a decisive formula/step, hypotheses and quantifier checks; Cauchy guidance explicitly rejects consecutive differences tending to zero as a sufficient proof.
- Worksheets with explicit exercise headings or numbered tasks are generated sequentially, one request per exercise, with a labelled combined result. Shared assumptions stay with every task; earlier hints are reused only from matching exercise sections. Other exercises in images are context only for a scoped request. Unlabelled/image-only worksheets use an all-parts coverage prompt; image legibility and completeness still depend on the model.
- Stop cancels the whole current hint batch and prevents later exercises from starting; partial results are never stored as an opened level. Reset hints clears existing levels in the workspace after confirmation so they can be generated again, preserving the problem, knowledge, notes, conversation and saved library copy until Save.
- Interface text is slightly larger (generally +2px for smaller labels, controls and body copy). MathLive placeholders use explicit text formatting, preserving word spaces in Problem, Notes and Chat without changing their selected typing mode or stored content.
- The 17 common keys now include the native subscript action xₙ; selected expressions become the whole subscript base. Calculus & series includes indexed union/intersection templates ⋃ and ⋂ with editable bounds and expressions.
- The PDF problem list starts expanded. The dialog is wider (up to 1360px), and its two-column list has a taller bounded viewport; narrow screens use one column.

Regression tests cover three-exercise hint batches, scoped previous hints, cancellation, local-only visual hint 1, reset/save isolation, spaced placeholder rendering, native subscript insertion and valid large set-operator templates. Live model reasoning and physical Chrome layout still require acceptance testing; model correctness is not established by mocked response tests.

## Shared keyboard, manual modes and visual problem context

- Desktop Workspace now has three rows: Problem (2/3) with an Illustrations panel (1/3), Knowledge/Hints across the second row, and Discussion/Notes on the third. Guidance cards have bounded 480px viewports and scroll internally; narrow screens stack the cards.
- A single movable symbol palette follows the most recently focused editable Problem, Notes or Chat field. Its active field label changes as focus moves. Common keys beside a field still target that field. All entry points share the floating palette and recent symbols. The palette portals into saved-note dialogs, checks live editor availability and cannot write into disabled, inert, read-only or unmounted fields. Search, dragging and clicking outside do not lose the editing target.
- Chat now uses the same visual MathLive input, including formula templates, Math/Text switching and Alt / Option. Newly written questions carry a LaTeX format tag and display as math in workspace and library conversations; existing plain-text messages still render normally.
- Automatic Math/Text typing recognition is disabled from the moment each editor mounts. Problem starts in Math, Notes/Chat in Text. The button or Alt / Option chooses the mode; words, accents and IME typing do not choose a mode. Plain text paste follows the selected mode. Explicit LaTeX MIME/delimiters and exact TeX in copied rendered HTML remain supported; OCR/import normalization is separate from typing.
- Selected **problem** images are actual typed inline-image parts on knowledge, hint and chat requests. Solution/notes images are excluded. The **Use this illustration for AI** checkbox defaults on for problem illustrations, including existing attachments; unchecked images remain available to view. Updating the selected visual context of an analyzed problem asks to clear its old knowledge/hints/chat while preserving notes and the saved library copy. Refresh knowledge to update analysis saved before visual support.
- No model is called on attach/view/select alone. Local requests use ONLY_ON_DEVICE and never retry in cloud or silently omit selected images. Unsupported local vision reports a clear failure. PNG/JPEG inputs retain their bytes; a WebP inference copy is converted locally because Firebase's native path supports PNG/JPEG. Originals stay intact for viewing/storage. Text-only verified-formula shortcuts are bypassed when images are included.
- Cloud consent now explicitly covers selected problem illustrations plus text/tutoring context. Cloud remains off by default. With permission enabled, analysis/hints can use cloud; first hints always stay local. Text-only first hints retain their local route, and chat follows its own Local/Cloud selection. Import transcription remains local-only, distinct from later image-based solving.
- Existing image-viewer controls, cancellation rollback, notebooks and recovery keys remain in use. Socratic tutoring stays deferred; the [proposal](docs/SOCRATIC_TUTOR_PROPOSAL.md) is preserved.

[Firebase's hybrid Web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) documents text-and-image on-device inference on compatible desktop Chrome. [Chrome's Prompt API](https://developer.chrome.com/docs/ai/prompt-api) describes its device/model availability requirements. API support does not guarantee correct geometry or proof reasoning. Prompts require reading marked labels and asking about missing/unreadable details, without inferring measurements from drawing appearance.

Validation covers real editor registration across fields/modal boundaries, explicit modes, rich chat rendering, selected-image isolation/consent, WebP preparation, on-device typed-image requests, no hidden fallback, cancellation and prior notebook regressions. Actual layout/caret behavior and local/cloud visual reasoning still require supported-device acceptance testing; no live model inference is claimed.

## Large attachment viewer

Click any problem/solution thumbnail in Workspace or the saved-page preview to open a large local image viewer. It provides Zoom in/out, Fit to window, Actual size, scroll-wheel zoom, and pointer/touch drag panning. Buttons and +/−/0/1 keyboard shortcuts control zoom; Escape, the close button or the outside backdrop close only the image viewer. The original image data is displayed; no AI call, upload, file rewrite or new tab is involved.

The library preview stays underneath with its unsaved notes intact. Its Escape/focus behavior is suspended while the image viewer is open. Closing the viewer restores thumbnail focus and the parent scroll lock. Shared reference-counted locks restore page scrolling even when nested dialogs unmount together. Save/analyze shortcuts cannot act behind the image viewer. Account changes clear the open image.

Tests cover thumbnail entry points, nested closing and unsaved notes, background shortcut isolation, zoom/fit/pan/error behavior, original image data preservation and nested scroll-lock cleanup. Browser geometry and trackpad/touch feel still require visual acceptance testing.

A researched [Socratic Tutor integration proposal](docs/SOCRATIC_TUTOR_PROPOSAL.md) is included for discussion. Tutoring behavior has not changed in this update.

## Typeset notes, manual input modes and a movable keyboard

- The problem editor now removes the outer inline wrapper's baseline space and uses a shorter root line height, bringing the first line nearer the top. Overrides remain at the root level so fraction/radical internals keep their native layout. These rules are installed after the MathLive mount as well as initial attachment.
- The expanded symbol panel has a drag handle. Drag it anywhere within the browser viewport, or focus the handle and use arrow keys. Its position survives closing/reopening, and resize clamps it to keep controls reachable. Clicking outside, pressing Escape in the workspace or starting an AI task does not close the panel. Close the shared palette with **×**; hiding common keys does not close the shared window.
- Problem and notes editors have a small **Math / Text** button. One Alt/Option tap in the focused editor also switch mode. Automatic guessing is disabled from the start; Text keeps ordinary typing/pasted prose literal and Math accepts mathematical input. LaTeX clipboard MIME takes precedence. Modifier chords such as Ctrl+C/V/S, held/repeated Control keydowns, composition and focus changes do not count as a double tap. Switching at the caret does not mark the exercise dirty; converting a selection does.
- Notes now use the visual math editor in both workspace and saved-page preview. The default typing mode is Text; the toggle and symbols insert typeset math. Notes support multi-line paste, Enter for another line, explicit LaTeX delimiters, a 30,000-character storage limit and mathematical templates at the editor caret.
- Copied KaTeX/MathJax HTML can supply exact TeX via MathML annotations. The paste handler uses that TeX with surrounding prose, suppresses duplicate visual fallback text, and inserts no clipboard HTML. Plain text/explicit LaTeX remain the fallback when the source does not expose annotations. Manual Text mode can paste content literally instead.
- Edited rich notes are tagged with optional `notesFormat: 'latex'`. Existing notes without a format are converted only for display; opening a page never rewrites them. Preview saves patch only the edited notes, solution attachments/image names, memberships and time, and workspace/draft copies retain the format through recovery and explicit Save. Existing notebook/account keys are unchanged.

Validation includes mode switching and Ctrl shortcut boundaries, legacy/rich note save/reopen, mathematical clipboard recovery, local insertion, drag/resize/persistent-panel interactions and previous notebook regression cases. These DOM/source tests do not verify actual Chrome font/caret/first-line geometry; browser acceptance testing is still needed for that geometry and touch dragging.

## Workspace refinement and local image import

- The header and favicon use **Σ**. The discussion card is on the left and notes on the right, retaining their previous desktop proportions (1.9:1.1) and input heights. On narrow screens they stack in that order.
- A workspace toolbar keeps import, save, Cloud AI permission and math-size controls together; it stays visible on wide screens. Problem images are now visible in the separate Illustrations panel. Knowledge and hints remain bounded, with stable scrollbar gutters and per-level Show/Hide controls. AI runs show elapsed seconds and retain Stop AI.
- Workspace changes autosave after 750 ms to a separate, account/project-scoped IndexedDB draft. Reload offers **Resume draft** or **Start fresh**. This never updates a saved library exercise: **Save exercise / Ctrl+S** remains the explicit commit. Draft writes and deletion are serialized so late writes cannot resurrect discarded copies. Manual sign-out/open-another-page confirms discard. This stores one workspace draft per account on this browser; cross-tab merging and cloud backup are not provided.
- The library can search names, problem text and notes (accent-insensitive), filter completion status and sort by updated date or name. Opening a saved result still opens the notes-editable preview first.
- The keyboard keeps 17 common symbols visible. **More symbols** opens a floating, categorized drawer with search and six recently used symbols, without stretching the cards. The drawer now closes only through explicit controls and can be moved; insertion keeps the editor caret. **Ctrl+Enter** analyzes the problem or sends the focused discussion question. Math size changes affect display, not saved formulas.
- **Read image** accepts PNG/JPG/WebP up to 10 MB, resizes locally and opens a source/transcription review. **Read with AI → Local AI** invokes Firebase ONLY_ON_DEVICE with image input; there is no implicit cloud fallback. **Cloud AI** is a separate opt-in transcription route with per-image consent. If the device cannot process images, bilingual Tesseract OCR runs locally using bundled engine/language assets. **Read printed text** selects that path directly and works without Firebase AI quota after app/OCR assets are available. The optional loopback formula cropper remains available for corrections.
- Images and PDFs are compared with a directly editable formatted transcription side by side. Image reading, printed OCR, PDF import and formula recognition have cancellation. Closing an image review aborts its job. No partial or late recognition is applied. Replacing an analyzed problem requires confirmation, clears only its knowledge/hints/chat and preserves notes. Saving the source image is optional and respects the four-image limit.
- Local image-AI availability depends on Chrome, device and the downloaded model. Printed OCR cannot reliably reconstruct every fraction, handwritten formula or page layout. Review against the source before analysis. No claim of universal math OCR accuracy is made. Formula OCR may download its model on first use, but the selected crop is processed only by the loopback service.

Validation covers draft isolation/recovery/deletion races, search/sort, shortcut/modal boundaries, image review/Stop, typed on-device-only image calls, browser OCR fallback and worker cleanup, plus existing notebook regression tests. A real bilingual Tesseract smoke test reads a synthetic printed equation; spacing still needs review. Browser layout, MathLive caret/hover geometry and physical Chrome image-model inference require acceptance testing on a supported device.

## Problem and PDF normalization; expanded math keyboard

- Mixed text recognition now checks Unicode words, including short Vietnamese words such as “là”, “và”, “đề”. Lettered options are text labels, while set relations, empty sets, number sets and literal set braces are mathematical content. Zero, Latin O and the empty set are never substituted for one another.
- A shared local formatter joins soft wraps, normalizes whitespace and separates a), b), c) options while preserving explicit math delimiters and paragraph breaks. Multiple logical lines render as editor-only `mathfolio-line` class wrappers. These wrappers are removed from AI learning data; old saved exercises are not migrated or rewritten.
- The editor aligns content at the top with less padding. Only root layout struts are suppressed; fraction/root internals retain their native layout. Logical lines use block layout and normal text wrapping inside the bounded viewport. Actual caret/hover geometry still requires Chrome acceptance testing.
- Selectable PDF extraction now groups fragments by position and relative font size, rather than inserting a newline for every changed baseline or hasEOL flag. Small raised/lowered fragments adjacent to a math base can be reconstructed as scripts. Vietnamese Bài/Câu and chapter-number exercise headings are recognized. This does not infer missing fraction bars, radicals or symbols from damaged OCR; use the existing local formula cropper and compare against the PDF page when needed.
- The PDF picker opens with normalized editable math fields and Restore extracted text. Choosing or formatting a question does not call AI. Original extracted text remains available for comparison before import.
- A shared keyboard keeps 17 common symbols visible and offers More symbols with seven categories: powers/arithmetic, sets/logic, relations/arrows, calculus/series, functions, Greek letters, and vectors/matrices. It contains over 100 symbols/templates, also available in the notes keyboard. Notes now use typeset mathematical editing; see the newest section above.
- Regression coverage includes Vietnamese prose, set notation, literal braces, zero versus empty set, option boundaries, explicit multiline LaTeX, geometric PDF script reconstruction, categorized keyboard interactions and all symbol templates. Testing uses supplied examples and synthetic PDF fragments; no original PDF was attached in this request. Visual acceptance and OCR accuracy must still be checked against the source document.

## Khởi động nhanh và lưu bài đang làm

Mở trình khởi động cho hệ điều hành của bạn theo [README](README.md#chạy-thử-trên-máy-của-đồng-đội). Bạn có thể lưu đề, ghi chú và ảnh vào thư viện trước khi chọn **Confirm & analyze**, kể cả khi chưa có quota. Mở lại bằng **Open in workspace** để tiếp tục hoặc phân tích sau.

## Stable scrolling, Cloud AI controls and improved input

- Scroll containers reserve a constant thin scrollbar gutter before overflow and on hover/focus; removed the CSS switch between native standard/WebKit widths. The document also reserves its scrollbar gutter to reduce shifts when opening dialogs. The thumb can appear without taking width away from the text. Visual acceptance is still needed in Chrome at different zoom levels.
- A Cloud AI On/Off switch sits below Save exercise. Analysis and every hint use the on-device model by default; local prompts are kept compact. Cloud analysis and hints require explicit Cloud AI permission; first hints always stay local. Selecting Cloud chat or enabling the switch asks for consent when permission is off; denial/Escape/backdrop cancellation sends nothing. Turning permission off selects Local chat. Offline cloud generation stays unavailable, and signing out resets consent. Enabling the switch by itself does not call AI.
- Chat uses two side-by-side Local AI / Cloud AI buttons with the selected route emphasized. Selecting Local chat does not revoke permission for cloud hints; the top switch controls that permission.
- Powers from the toolbar and the physical ^ key use MathLive's native superscript navigation, so fenced groups stay intact; a selected expression becomes the entire power base. Smart fences remain enabled. Variable exponents remain open for multiple characters, with arrow keys used to leave them.
- Paste handling recognizes common inline equations, ASCII fractions, Unicode squared/cubed notation and prose. Explicit $...$, $$...$$, \\(...\\), \\[...\\] or application/x-latex data preserve LaTeX; MathLive's structured clipboard format is delegated to its native handler. Prose is escaped into text spans. This is conservative local parsing, not a universal semantic classifier: inspect ambiguous or unusual notation after pasting. Oversized paste is rejected without truncating the current expression.
- Notes in workspace and library preview have a toggleable math-symbol keyboard (², ⁿ, √, ∫, ∑, fractions, inequalities, Greek letters). It inserts typeset LaTeX symbols/templates at the caret and preserves selected text for powers/roots/fractions. Legacy plain-text notes remain readable; new rich edits carry an explicit LaTeX format tag.
- Added simulated DOM interaction coverage for consent/cancellation/offline behavior, route/switch synchronization, notes keyboard persistence, and editor clipboard/keyboard events. Actual MathLive layout/caret behavior and hover geometry still need testing on supported Chrome hardware.

## Saved-page preview and stopping AI

- **Open exercise** now opens a scrollable saved-page dialog in the library, showing the problem, essentials, opened hints, notes, attached images and conversation without running AI. Notes, solution images, image names and folder memberships can be edited here. **Save notes** updates the notes of the existing saved page; unsaved note changes are protected when closing the dialog with Close, Escape or the backdrop.
- **Open in workspace** opens an independent draft with the same exercise ID. Workspace edits do not affect the saved page until **Save exercise**, which updates the existing page directly. **Rename / move** opens the name/folder dialog; new exercises still ask for their initial name/folder. Leaving an unsaved workspace draft requires confirmation.
- Every notebook AI task has **Stop AI**, available during preparation and generation, including after navigating to another tab. Local responses stream as they are generated; Cloud responses are returned when generation completes to avoid Firebase AI stream parsing failures. Stopping clears only the active request's partial text, restores the prior page state and retains the chat question. No partial result is saved or allowed to overwrite a later task. Existing knowledge, hints, chat, notes and dirty status are kept. Account changes/unmount also cancel active requests.
- Cancellation uses AbortSignal for cloud HTTP requests and native Chrome local session/prompt options. An abort-aware wait releases the UI even if a provider is slow to acknowledge cancellation. Cloud cancellation is client-side: a server request already being processed may still count toward usage. Physical Gemini Nano cancellation still needs acceptance testing on a supported Chrome device.
- Added happy-dom as a development dependency for interaction tests of preview-only note editing, workspace save isolation, and cancellation of knowledge, all hint levels and chat. These simulated DOM tests do not verify visual layout or MathLive caret behavior.

## Mathfolio: folder controls and compact hints

The displayed product name and browser title are now Mathfolio. Existing Firebase project names, app IDs and IndexedDB keys are intentionally retained so existing accounts and saved pages remain accessible.

- Fixed the MathLive root formula wrapper: its library default `width: min-content` was making words occupy separate lines. The root now uses the available width, with normal wrapping and a bounded vertical viewport; fraction/root internals keep their layout.
- Knowledge and hint cards now share a bounded second row. Hint content scrolls inside its card; generated levels have Show/Hide controls that never regenerate AI and do not change which levels have been unlocked. These display choices reset when opening another exercise.
- Library has New folder (custom name), duplicate-name validation and Delete folder actions. Deleting a custom folder requires confirmation and removes only that membership; all pages remain in My exercises and their other folders, preserving content/attachments. The default recovery folder cannot be deleted. Folder changes use the same account-scoped local storage, and only succeed in the UI after storage completes.

## Refinement: formulas, editing and overflow

- Edit/discard/delete/sign-out confirmations are styled in-app alert dialogs with focus trapping, Escape cancellation and an inert background. No native window.confirm remains in the notebook.
- Problem text is smaller, wraps at the top-level rendered expression, and scrolls vertically in a 220px viewport. MathLive 0.111.4 is pinned; wrapping overrides are scoped to its top-level shadow DOM so fraction/root internals keep their math layout. Visual and caret behavior still need acceptance testing in Chrome.
- Thin rounded scrollbars for problem, knowledge and chat appear on hover or keyboard focus without changing the available width; touch devices keep them available.
- Local reference cards explicitly identify their source; no language-model call is claimed for these cards. Existing saved content remains intact until refreshed.

## Update: visual math input and English interface

The problem box now uses MathLive: symbols render while typing. The x² key inserts a superscript at the cursor without duplicating x. Typing now uses explicit Math/Text mode buttons or Alt / Option, with automatic guessing disabled. LaTeX remains the storage/AI representation; the editor displays typeset math. Fonts are bundled locally for offline use.

There is no subject selector or subject assumption in notebook AI prompts. Knowledge generation receives only the current problem and uses English. Recognized single-variable linear/quadratic equations get verified local formula cards with conditions and no numeric solution, labeled local reference rather than AI. Other analysis and all hint levels use the on-device model by default, with compact prompts to reduce device input limits; enable **Cloud AI** to use Firebase AI for analysis and hints 2/3. Conditional reference cues cover derivatives, integrals, logarithms, trigonometry, right triangles, probability, sequences and matrices; this is not an exhaustive mathematics engine. Previous knowledge/chat is excluded from re-analysis to avoid repeating an unrelated course overview. Existing saved answers are preserved; choose **Refresh knowledge** to regenerate in English.

Enter a problem by typing or pasting LaTeX into the math editor, or choose **Choose PDF** at the top of the Workspace to upload a PDF at any time. Selectable text is extracted directly; pages without text are rendered and OCR'd locally in English. OCR preserves the page text, but Tesseract is not a math-structure recognizer, so review equations carefully. The PDF picker presents detected questions in a searchable list, with an editable transcription and formatted preview. **Read this page with Cloud AI** asks for separate consent and sends only the selected page image; its result replaces the selected text for review. Cloud image reading is not automatic. The problem editor stores LaTeX and renders formatted mathematics. Replacing an already analyzed problem with PDF text asks for confirmation, clears its old knowledge/hints/chat, and keeps notes and attachments. PDF import is limited to 10 MB, 60 pages / 150,000 extracted characters; numbered questions are offered individually, or page text when numbering is not detected. The problem editor limit remains 6,000 characters. To test OCR, upload your own raster-only PDF containing mathematical notation and compare the extracted text with the original before using it.

The local formula model can misread unclear, handwritten, or unusual notation; review and edit its LaTeX output before using it. Complex problems may show a **Consider Cloud AI** recommendation. This does not enable Cloud AI or send the problem; the user must explicitly allow Cloud AI and start an AI action.

Knowledge and hints now occupy the full second row in bounded 480px cards with internal scrolling. On narrow screens they stack with bounded 400px heights. The rest of the notebook remains in normal page flow.

# Sổ bài tập StudyLens — bản đầu

Nhánh này chuyển giao diện sang sổ bài tập theo bản phác thảo. React/Vite, Firebase Auth, cấu hình emulator và dịch vụ AI hiện tại vẫn được dùng; không thay .env.local hay triển khai Firebase rules.

## Chạy

- Node.js 24 LTS; npm ci; giữ cấu hình Firebase Web/App Check hiện có trong .env.local.
- Nếu dùng emulator: VITE_USE_EMULATORS=true; Java 21 và Firebase CLI.
- Cửa sổ 1 (lần đầu):

```sh
firebase emulators:start --only auth,firestore,storage --project demo-studylens-local --export-on-exit=.emulator-data
```

- Sau khi đã thoát bằng Ctrl+C và có thư mục .emulator-data, những lần sau:

```sh
firebase emulators:start --only auth,firestore,storage --project demo-studylens-local --import=.emulator-data --export-on-exit=.emulator-data
```

Trên Windows dùng `firebase.cmd` nếu PowerShell chặn firebase.ps1. Giữ dữ liệu Auth emulator qua các phiên để UID tài khoản không thay đổi. Tạo lại cùng email với UID mới sẽ mở một cuốn sổ local khác. Không commit .emulator-data hoặc token.

- Cửa sổ 2: npm run dev (Windows: npm.cmd run dev). Đăng nhập/đăng ký bằng Auth hiện tại. Gemini vẫn kết nối project thật qua getCloudFirebaseApp; emulator không mô phỏng Gemini.

## Luồng dùng thử

1. Nhập/dán đề, chọn môn, chèn ký hiệu tại con trỏ; xem trước công thức.
2. Chọn **Add content → Read image**, ưu tiên **Read printed text** hoặc chọn **Local AI / Cloud AI** rồi **Read with AI**. Cloud hỏi đồng ý riêng trước khi gửi ảnh nguồn. Bấm ảnh để xem lớn, sửa trực tiếp trong **Review your problem**, soát công thức rồi dùng đề. Illustrations không có nút đọc chữ riêng.
3. Xác nhận đề & phân tích: local AI dùng đề và các ảnh minh họa đã chọn để nhận kiến thức cần biết. Người dùng chịu trách nhiệm kiểm tra đề. Bản đầu chưa tự chuẩn hóa đề bằng AI.
4. Mở hint 1 local. Chỉ sau khi có hint trước mới mở được tầng tiếp theo. Hint tiếp theo dùng cloud khi bật Cloud AI và có mạng; nếu không, dùng local khi khả dụng. Chưa mở thì không gọi AI hay tạo trước nội dung.
5. Chat chọn local hoặc cloud; cloud cần đồng ý. Khi offline tự chọn local. Prompt dùng đề, kiến thức, hint đã mở và tối đa 6 tin nhắn gần nhất (mỗi tin tối đa 1.500 ký tự). Cả lịch sử vẫn được lưu trong sổ.
6. Viết ghi chú/bài làm, đính kèm ảnh giải (PNG/JPG/WebP, tối đa 3 MB/ảnh, tổng 4 ảnh/bài).
7. Lưu bài: đặt tên, chọn/tạo thư mục, đánh dấu đang làm/đã hoàn thành. Chỉ thông báo đã lưu sau khi IndexedDB ghi thành công.
8. Mở Thư viện → thư mục → Mở bài. Đề, kiến thức, hint đã mở, ảnh, ghi chú và chat được phục hồi; không tạo lại AI. Có thể sửa ghi chú, lưu đè cùng bài, hoặc xóa.
9. Sửa đề đã xác nhận sẽ yêu cầu bỏ kiến thức/hint/chat cũ để tránh trộn bài; giữ ghi chú và ảnh.

## Lưu trữ và giới hạn

- Notebook mới lưu IndexedDB, khóa bởi Firebase project ID + UID. Không hiển thị sổ người khác khi đổi tài khoản. Đăng xuất xóa trạng thái trên giao diện nhưng giữ sổ trên thiết bị.
- Luôn cần đăng nhập trước khi dùng sổ; đăng ký/đăng nhập mới cần Auth/emulator. Có mạng không tự gửi bài lên cloud. Đồng bộ Firestore/Storage chưa có trong bản này.
- Dữ liệu chỉ có trên trình duyệt/profile này; xóa dữ liệu trình duyệt có thể mất sổ. Giữ cùng Auth UID và emulator export để mở lại.
- Kho ghi chú legacy trước đây không bị xóa, chưa được chuyển vào notebook mới. Các module reader/upload legacy vẫn giữ trong source, nhưng không nằm trên giao diện sổ.
- Prompt ngắn và streaming vẫn dùng, không đảm bảo độ đúng hoặc hỗ trợ tiếng Việt của local trên mọi thiết bị. Quick/Hint legacy vẫn tồn tại cho code cũ.
- PDF text extraction, English-only local OCR, optional local formula-to-LaTeX recognition, local image OCR, and consent-gated Cloud AI image transcription are available. OCR output must be reviewed; Cloud AI is never used automatically for image reading. Cloud notebook sync, sync conflict handling, and production deployment are not implemented.

## Kiểm tra

```sh
npm test
npm run build
```

Tự nghiệm thu với emulator: hai tài khoản A/B (không thấy sổ nhau); lưu rồi F5; sửa lại cùng bài không nhân đôi; tất cả 3 hint; tắt cloud consent; chat offline sau khi model sẵn sàng; sai password; lỗi IndexedDB; giữ ảnh/LaTeX khi mở lại; restart emulator với import/export.
