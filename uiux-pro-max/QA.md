# QA: "Tool Tags" (uiux-pro-max)

Checked 2026-11-24. Method: laptop screenshots (1280×800), phone (390×844) and tablet (768×1024) screenshots, plus a headless-Chrome script that loaded every page at 360, 768 and 1280 px and measured page width, inner table/SQL overflow, `td` font size and tap-target height, then clicked through the kiosk, requests, items and people flows and read back the results.

Severity: **Blocker** (can't finish the task), **Major** (wrong, unsafe or breaks a class rule), **Minor** (friction).

## 1. Mika, member, at the door with one hand full
- Typing `00101` shows "✓ Mika Santos, Member" right away, so she knows the number worked. Purpose tiles and the Sign in button are 56–64 px tall. Good.
- Confirmation is a full-panel "Welcome, Mika!" with time and purpose, and it clears itself after 8 s. Good.
- Signing out: the black "Leaving? Sign out here · 4 inside ↓" bar at the top of the phone screen jumps straight to the list. Sign out has an 8 s Undo. Good.
- **Minor:** on a 390×844 phone the Sign in button sat below the fold, under the purpose tiles, so she had to scroll with her thumb to reach it.
- **Minor:** Sign out has no confirm step, so a wrong tap signs out someone else. The Undo toast covers it. Kept, because a confirm would slow every exit.

## 2. Visitor from another school, Workshop
- The "Visitor · No PUP student number" tile is the obvious choice, and the student-number field disappears when it's picked. Name, contact, affiliation and purpose each have a label and a hint, and bad input gets its own message ("Use 11 digits, like 0918 555 0107"). Good.
- A visitor already inside (Lea, matched by contact number) is blocked, with a button that jumps to her Sign out. Good.
- **Minor (open, PHP):** a returning visitor creates a new `person` row every visit. The rebuild should match an existing person on `contact_number` first.

## 3. Paolo, officer, on his phone
- Pending requests reflow into cards. Approve opens a dialog that lists each line as "2 available → 1 after". Focus lands on **Cancel**, so a double tap can't approve by accident. Good.
- #1012 asks for 2 multimeters with 1 free. Its Approve is dashed and inactive, the line says "only 1 available", and a red note spells it out: "Not enough stock: Digital multimeter asks 2, only 1 available. Wait for a return or restock, or reject and ask for fewer." Tapping the blocked button repeats the reason in a toast instead of doing nothing. Good.
- Stock is tracked across requests. Approving #1013 (3 cutting discs) left 1, which instantly blocked #1014 (asks for 2). Marking a multimeter returned freed #1012 again. Tested by script. Good.
- His own request #1015 is blocked with the reason `chk_request_not_self`. Reject needs a written reason. Good.
- Overdue tools have a red "! Overdue" tag and come first in "Tools out".
- **Minor:** on a phone, "Tools out" is a long scroll below Pending, and there was no quick way to reach it.

## 4. Inventory officer at a laptop
- Adding a consumable without a reorder level is refused ("Consumables need a reorder level so low stock gets flagged"). Duplicate names are refused (`uq_item_name`). Edit fills the same form, which is retitled "Edit item #1" / `UPDATE item`. Good.
- Restocking 6 solder wire took it from 3 to 9. The red low-stock row and tag cleared, the restock log got a new row, and the dropdown now reads "(9 left)". Good.
- The "Low stock only" filter is kept in the URL (the dashboard links to `items.html?low=yes`). Good.

## 5. Sir Espineli, DBA professor
- Every panel carries a black tab naming its table, view or statement (`v_open_loans`, `INSERT INTO restock`, `attendance WHERE time_out IS NULL`). Column headers show the SQL column under the label. Business rules appear next to the forms with their trigger or constraint names: `trg_member_requires_student_id_ins`, `trg_line_consumable_ins`, `uq_line_request_item`, `chk_attendance_times`, `chk_request_not_self`, `trg_request_approver_ins/upd`, `chk_restock_qty`. Good.
- Reports show each result beside its exact SQL.
- **Minor:** no report showed `v_item_stock` itself, the view everything else depends on.
- **Minor (open):** nothing in the UI sets a request to `completed` when all its tools are back. This is documented for the rebuild in NOTES.md.

## 6. Sir Cadaoas, UI rules
- Limited palette, with red only on primary buttons and alerts that need action. Status always has an icon and text. Body is 16 px, table text is 16 px. CSS variables, one `style.css`, the same header on all 8 pages with the current page highlighted (`aria-current`). Labels, hints and errors on every form. Alt text on the logo. Focus rings everywhere. Contrast was checked on the risky pairs: muted on table head ≈5:1, white on red ≈4.8:1, red-dark on red-soft ≈6:1.
- **Major:** three font families (Space Grotesk, Public Sans, plus monospace for SQL). The rule is two at most.
- **Major (pass 1):** at 1280 px the Menu button showed in the desktop sidebar, because `.btn` was declared later and overrode `.menu-btn { display:none }`.
- **Major (pass 1):** the People table and the Decided table were wider than the page at 1280 px. At 768 px, Items and People pushed the page sideways (the visually-hidden "Actions" header escaped the scroll wrapper). SQL captions broke mid-word (`reques t_id`), and so did report headers.

## 7. Hans, rebuilding in PHP
- Plain HTML, one CSS file, one `app.js` of small commented functions, no build step or modules. Form `name`s match the columns (`student_id`, `purpose_id`, `item_type`, `quantity_total`, `reorder_level`, `restocked_on`, `requested_by`, `due_date`, `remarks`). Good.
- **Major:** the New request form repeated `name="item_id"`, `quantity` and `due_date` on each line, so PHP would only receive the last line.
- **Minor:** the helper named `$` looks like jQuery or a PHP variable. It's explained in a comment at the top. Kept.

## 8. Accessibility tester
- Skip link, visible focus, `aria-current`, labelled inputs, errors linked with `aria-describedby` and focused on submit, an `aria-live` toast region, and a native `<dialog>` that returns focus to the opener. Blocked Approve buttons use `aria-disabled` and stay focusable, with the reason linked. Kiosk radios are real radios, so arrow keys work. Good.
- **Minor:** the "You're already signed in" notice wasn't announced when it appeared while typing.
- **Minor:** the red focus ring in the sidebar and on kiosk tiles mixed the action colour into focus.
- **Minor (open):** in card mode (≤900 px) tables are `display:block`. Screen readers read the `data-label` text but lose the table navigation.

## Fix list (de-duplicated)
| # | Severity | Fix |
|---|---|---|
| 1 | Major | Two fonts only: Space Grotesk for headings and body, system monospace only for SQL/code. Public Sans removed. |
| 2 | Major | Request lines renamed to `item_id[]`, `quantity[]`, `due_date[]`. |
| 3 | Major | Menu button hidden on desktop (`.side .menu-btn`). |
| 4 | Major | Wide tables: People "Joined" folded into Role, cell padding trimmed, `position:relative` on `.table-wrap`, tables become cards at ≤900 px (was 640). Requests "Decided" moved to full width. |
| 5 | Major | Captions and report headers wrap at underscores (`<wbr>`); card labels get `minmax(0,1fr)` and tags may wrap. |
| 6 | Minor | Kiosk Sign in button is sticky at the bottom of the form on phones and tablets. |
| 7 | Minor | Requests page jump links: Pending / Tools out, overdue first / New request. |
| 8 | Minor | "Already signed in" notice gets `role="alert"`. Focus rings are ink everywhere. |
| 9 | Minor | New "Stock per item" report on `v_item_stock`. |

## After fixes
All 9 fixes are done and re-checked:
- **Overflow:** the script reports no page-level sideways scroll and no inner table or SQL overflow on all 8 pages at 360, 768 and 1280 px. Every button, link, select and input is ≥44 px tall. Every `td` is 16 px.
- **Flows (script):**
  - Mika signs in, and the list goes to 5.
  - Paolo typing `00214` shows the already-inside notice. Submitting is blocked, and "Go to my Sign out" focuses his Sign out button.
  - Lea re-registering is blocked.
  - Approving #1013 drops cutting discs to 1 and blocks #1014. Returning a multimeter frees #1012.
  - Reject without a reason is refused.
  - A consumable line disables `due_date`, and a tool line without a due date is refused.
  - Restock clears the low flag.
  - Adding a member without a student ID is refused with the trigger name.
- **Screens:** phone kiosk shows the Sign in bar pinned in thumb reach above the purpose tiles. Tablet kiosk is a clean single column with the Sign out jump bar. Laptop Items fits with no inner scroll. Phone reports show the SQL wrapped.

Still open, for the PHP rebuild (none block the prototype):
- Match returning visitors by `contact_number`.
- Gate the officer links behind a login on the door device.
- Auto-complete a request when all its tools are returned.
- Card-mode table semantics for screen readers.
- Without internet, Space Grotesk falls back to Segoe UI.
