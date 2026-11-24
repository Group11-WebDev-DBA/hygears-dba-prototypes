# QA: "Pit Wall" (impeccable direction)

Role-played visits per `../QA-PROTOCOL.md`. Checked with screenshots at 1280×800 (laptop), 768×1024 (tablet kiosk) and 390×844 (phone), a 360px overflow check on all 8 pages, and scripted click-throughs of the kiosk, requests, items, people and attendance logic in headless Chrome (56 checks, all passing after fixes).

Severity: **Blocker** (can't do the task), **Major** (task works but is slow, unsafe or breaks a brief rule), **Minor** (polish).

## 1. Mika, member, at the door with one hand full
- **Major:** the student number field opened the full text keyboard because PUP numbers contain "MN". Typing `2023-00118-MN-0` one-thumbed is slow.
- **Major (tablet):** in the 768px two-column kiosk the "In the HQ now" column was so narrow that names were cut to "Bea V…" next to the clock and button.
- Minor: on the phone the big clock wrapped to two lines ("11:05 / AM").
- Works: the purpose tiles are 60px tall, Sign in is a 64px red button in thumb reach, the live lookup shows "Mika Reyes · Member" before she presses, and the confirmation fills the card ("Signed in, Mika · Project work · time in 11:07 AM") and clears itself after 8 s. Sign out is one tap with a 6-second Undo in the same row.

## 2. Visitor from another school, no PUP number
- Works: "Visitor, no student number" is one of two big options. It asks for first name, last name, contact number and school, then purpose. Their row in the tower gets a VISITOR tag.
- Minor: nothing said why a stranger's phone number is collected.
- Minor (also hits Hans): the visitor and first-timer groups both have `first_name`/`last_name`, and the hidden group's inputs would still be posted.

## 3. Paolo, officer, on his phone between classes
- Works: Approve opens a confirm strip ("Approve #1043 for Andrea Cruz? Vernier caliper × 1 will leave the shelf." / Yes, approve / Cancel), so there's no one-tap approve. Reject needs a reason (`remarks`). #1041 shows "only 1 available" in red on the line and a block notice: "Can't approve yet: not enough stock. Asked for 2 × Digital multimeter (only 1 on the shelf)…". Approve stays focusable but is `aria-disabled`, and the stock is checked again at click time. His own request #1044 has no buttons and says another officer must decide it. Mark returned has Undo. Returning a multimeter unblocks #1041 on the spot.
- **Major:** on a phone the overdue torque wrench sat below four pending cards, so there was no quick way to it.
- **Major (brief rule):** `.btn-sm` buttons (Mark returned, Open loan, Edit) were 36px tall, under the 44px tap target.

## 4. Inventory officer at a laptop
- **Major:** the Torque wrench (0 of 1 available, out overdue) showed a green "In stock" status.
- **Major:** the People table squeezed into a two-column layout and clipped its Deactivate buttons. (Found on the same pass.)
- Works: the red notice names both low consumables with numbers and links to Restock. Low rows are tinted and say "Low stock" with an icon. Add item blocks a duplicate name (`uq_item_name`). Restock lists consumables only (because `v_item_stock` only adds restocks to consumables), rejects quantity 0 (`chk_restock_qty`), and clears the flag when stock goes above reorder level.
- Minor: after an Edit click the form is below the table. It scrolls there and focuses the name field, so this is acceptable.

## 5. Sir Espineli, DBA professor
- Works: each screen maps to its tables, and the rules show up where they bite:
  - visitors without a student number can't be made members (People; the button is replaced by "Needs a student number to join", and the form error quotes the rule)
  - consumables get "No due date: consumable" instead of a date field
  - self-approval is refused
  - over-stock approval is blocked
  - names are unique
  - restock quantity must be over 0
  - `can_approve` is editable in Settings
- Reports shows 6 queries, each with its SQL beside the result: inside now, `v_open_loans`, overdue, `v_low_stock`, attendance per day × purpose, and most borrowed. Each has Copy SQL.
- Minor: `decided_at` isn't shown in "Recently decided" (only the date of the request).

## 6. Sir Cadaoas, UI rules
- Works:
  - the palette is the brief's; red only marks primary actions and alerts that need action, and status always has icon + text
  - 16px body; fixed h1/h2/h3 in CSS variables
  - one `style.css`; the same top bar on every page with the current page underlined (`aria-current`)
  - labels, hints and errors on every form; alt text; visible focus rings
  - no page-level horizontal scroll at 360px (all 8 pages measured)
- Minor: there's a third typeface, Consolas, but only inside the SQL code blocks on Reports. Green/amber status tints are added for success and "due today" (always with icons).

## 7. Hans, rebuilding in PHP
- Works: plain HTML, one stylesheet, one script of named functions with comments. Form `name`s are the SQL columns (`student_id`, `first_name`, `contact_number`, `affiliation`, `purpose_id`, `role_id`, `email`, `joined_on`, `item_type`, `quantity_total`, `reorder_level`, `is_active`, `item_id`, `quantity`, `restocked_on`, `notes`, `requested_by`, `due_date`, `remarks`).
- Minor: the inventory table is drawn from a JS array (`ITEMS`), so he'll have to print the rows in PHP instead. Category and member selects use names as values, not ids. Both are noted in NOTES.md.

## 8. Accessibility tester (keyboard + screen reader)
- Works:
  - skip link and visible focus everywhere
  - toasts are in a polite live region, and errors use `role="alert"` or sit next to the field with `aria-invalid`
  - focus moves into the confirm strip, onto the block notice, to the confirmation card, and back to the Pending heading after a decision
  - icons are `aria-hidden`
- Minor: the kiosk's Sign in / Sign out switch used `role="tab"` without arrow-key support or tabpanels, so screen readers announced a tab widget that didn't behave like one.
- Minor: Undo in a toast is the last thing in the page's tab order (on the kiosk, Undo sits in the row instead).

## Fix list (de-duplicated)
| # | Sev | Fix | Status |
|---|---|---|---|
| 1 | Major | Student number matches on digits only; `inputmode="numeric"` gives the number pad | Fixed |
| 2 | Major | Kiosk tower at tablet width: name on its own row, full-width Sign out under it | Fixed |
| 3 | Major | Tool with 0 available shows "All out on loan" (amber + clock), not "In stock" | Fixed |
| 4 | Major | `.btn-sm` is 44px tall on phones | Fixed |
| 5 | Major | Requests: jump links (Pending / Out on loan · 1 overdue / New request) | Fixed |
| 6 | Major | People: table full width, Add person form below it (+ "Add person" link) | Fixed |
| 7 | Minor | New-request item lines: date field was truncated; due date now on its own row | Fixed |
| 8 | Minor | Hash links landed under the sticky bar: `scroll-margin-top` | Fixed |
| 9 | Minor | Kiosk switch: plain toggle buttons with `aria-pressed` | Fixed |
| 10 | Minor | Hidden visitor/student inputs disabled so they aren't posted | Fixed |
| 11 | Minor | Visitor hint says why the contact number is kept | Fixed |
| 12 | Minor | Kiosk clock no longer wraps; Attendance "inside" clock stays together on phones | Fixed |
| 13 | Minor | Show `decided_at` in Recently decided | Open |
| 14 | Minor | Toast Undo is far in the tab order on officer pages | Open |
| 15 | Minor | Report result tables scroll sideways inside their box on phones (no page scroll) | Open, by design |

## After fixes
Re-shot the phone (requests, dashboard), the tablet kiosk and the laptop (people, items) and re-ran all scripted checks:
- Kiosk: 17/17. Digits-only lookup, first-timer, visitor, already-inside error, sign-out Undo and search all work.
- Requests: 18/18. Blocked approve, confirm, reject needs remarks, return unblocks, new-request validation all work.
- Items: 12/12. People: 5/5. Attendance: 4/4.
- 360px check: every page's `scrollWidth` fits the viewport.

The tablet kiosk now shows full names with the clock beside them and a full-width Sign out under each. The phone Requests page opens with the jump row, and "1 overdue" is visible without scrolling. No blockers or majors remain.
