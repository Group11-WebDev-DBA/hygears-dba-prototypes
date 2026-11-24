# QA: "Ledger" direction (taste)

Checked 2026-11-24 with headless Chrome: laptop 1280x800, phone 390x844, tablet 768x1024. A script clicked through every flow (kiosk sign in/out, visitor, approve/reject/return, new request, add item, restock, member rules, filters, lookups) and measured horizontal overflow and tap sizes at 360px on all 8 pages.

Severity: **Blocker** (breaks a task or a brief rule), **Major** (task gets slow, unclear or unsafe), **Minor** (polish).

## 1. Mika, member at the door, one hand full
- Sign in is 3 taps: type the number, tap Project work, tap Sign in. Her name appears under the box as she types, so she knows it's the right record. Confirmation is a big check, "Signed in. Welcome, Mika.", the time in, and it resets itself after 8 seconds. Good.
- Signing in twice is caught: "already signed in since 08:49. To leave, tap Sign out next to your name."
- **Major:** on a phone the "In the HQ now" list starts below the fold, so signing out means scrolling past the whole sign-in form.
- Sign out asks "Sign out Mika Santos?" before closing the row. Good: nobody signs out someone else by mis-tapping.
- Minor: the clock wraps under the heading on a phone.

## 2. Visitor from another school, Workshop
- "Visitor" is one half of the top switch. The fields say why the contact number is asked for. A short number gets "Use at least 7 digits". The visitor shows in the list with a `visitor` tag. Good.
- An unknown student number tells them to tap Visitor instead of a dead end. Good.

## 3. Paolo, officer, on his phone
- Approve and Reject both open a second step ("Approve #1017 for Mika Santos? Gives out Vernier caliper ×1 until 24 Nov, …"), so one stray tap can't approve. Reject asks for a reason (`remarks`).
- Not enough stock: #1018 is flagged as soon as the page loads, the short line reads "1 available, not enough", and Approve shows "Not enough stock to approve. Digital multimeter: asks for 2, only 1 available. Ask Jun to lower the quantity, wait for a return, or reject with a reason." Returning the two multimeters unblocks it right away. Good.
- His own request #1016 has no buttons and explains why. Good.
- Overdue loans come first, with a red bar, an icon and "Overdue 2 days", plus the borrower's contact number. Mark returned asks first.
- **Major:** on the blocked card Approve was still solid red, so it looked like the next step even though it can't go through.
- **Major:** the tool/consumable line and its due date ran together ("Digital multimeter ×2 Tool, due 25 Nov") because `.sub` only broke lines inside table cells.

## 4. Inventory officer at a laptop
- Adding "Heat shrink tube 3 mm pack" as a consumable works. Duplicate names are refused ("names are unique"). Restocking solder wire with 10 shows "1 → 11 available. No longer low.", clears the red flag, and adds a row to Recent restocks.
- Low stock is visible three ways: the dashboard number, the flagged rows, and the "Low stock only" filter (the dashboard links straight to it with `?low=1`).
- **Major (phone):** in the stacked rows every item began with `item_id 1` before its name, so the list read as numbers.
- Minor: the Type filter text is cut off ("Tools and consu…") at 390px.

## 5. Sir Espineli, DBA professor
- Every form label prints its column (`person.student_id`, `request_line.due_date`…) and every panel names the tables or views it reads (`v_item_stock`, `v_open_loans`, `v_low_stock`). Table headers in People and Reports use the real column names.
- Reports shows six queries with the SQL beside the result, using all three views, a GROUP BY per day and per purpose, and a most-borrowed join.
- "Business rules and where they live" lists every trigger and check (`trg_member_requires_student_id_ins`, `chk_request_not_self`, `trg_line_consumable_ins`, `uq_line_request_item`…), each with a link to the place in the UI where it shows. It also names the one gap the UI covers (over-approval).
- Rules can be seen in action: a visitor can't become a member (People), consumables turn the due date off (New request), and a repeated item is refused.
- **Blocker:** at 360px the Reports page scrolled sideways (435px), because long trigger names like `trg_member_requires_student_id_ins` couldn't wrap in the stacked rows.

## 6. UI rules (Sir Cadaoas, ui-requirements-nov21.md)
- Palette: white, #F4F5F7, ink, #5B6270 and red only on primary buttons and need-action alerts. Two fonts (Instrument Sans, DM Mono). Hex CSS variables, one style.css, the same header and nav on all 8 pages, with the current page underlined (desktop) or barred on the left (menu).
- Every status has an icon and a word. Every form has labels, hints and errors under the field. Focus ring is 3px ink.
- **Major:** table text was 15px, under the 16px body rule.
- Minor: a few inline `style=""` attributes; the rule wants everything in the stylesheet.

## 7. Hans, rebuilding in PHP
- Plain HTML with `name=` attributes equal to the SQL columns, `data-*` attributes holding the ids PHP will print, comments on the header/footer marking the future `header.php` / `footer.php`, and a SQL comment above each action in app.js (`UPDATE attendance SET time_out = NOW() …`). No modules or build step.
- Minor: inline styles (same as 6).

## 8. Accessibility (keyboard + screen reader)
- Skip link first, a visible focus ring everywhere, real `<button>`s, `aria-pressed` on the member/visitor switch, `aria-expanded` on Menu, `aria-current="page"` in the nav, and errors linked through `aria-describedby`. The confirmation steps and result messages take focus, so they're read out.
- The nav count read "3" with no meaning; changed to "3 pending" (hidden text) during the build.
- Minor: the confirmation sheet had both `aria-live` and focus, so it was read twice.
- Minor: the blocked Approve button wasn't announced as unavailable.
- Minor: the in-table links in "Business rules" are 24px tall (text links in running text, allowed).

## Fix list (de-duplicated)
| # | Fix | Severity | Status |
|---|---|---|---|
| 1 | Reports scrolls sideways at 360px (long names in stacked rows) | Blocker | Fixed: `overflow-wrap: anywhere` on stacked cells, `min-width: 0` on report columns |
| 2 | Kiosk: Sign out list below the fold on phones | Major | Fixed: "Leaving? Sign out" button at the top (phones only) jumps to the list |
| 3 | Blocked request still shows a red Approve | Major | Fixed: outlined and grey when blocked, plus `aria-disabled`; tapping it still repeats the reason |
| 4 | Line item and due date run together | Major | Fixed: `.sub` is a block everywhere |
| 5 | Stacked rows start with the id, not the name | Major | Fixed: the name cell moves first on phones (`order: -1`) |
| 6 | Table text 15px | Major | Fixed: 16px |
| 7 | Inline styles | Minor | Fixed: `.mt`, `.mt-lg`, `.mb`, `.choices-2`, `.rl-msg` classes. Only the bar widths in Reports stay inline, because they are data |
| 8 | Double announcement of the confirmation | Minor | Fixed: `aria-live` removed, focus kept |
| 9 | Clock wraps on phones | Minor | Fixed: sits beside the new Sign out button |
| 10 | Type filter text cut off at 390px | Minor | Open |
| 11 | Small text links in the Business rules table | Minor | Open (running-text links) |

## After fixes
- Re-ran the full click-through script: all 30 checks behave as described above.
- At 360px all 8 pages have no sideways scroll (Reports dropped from 435px to the viewport width), and no control outside running text is under 44px.
- Re-shot requests at 1280 and 390 and the kiosk at 390. The blocked card now shows a grey Approve beside the red message box. Item lines read as two lines. The kiosk has "Leaving? Sign out" and the clock on one row above the form.
- Still open: #10 and #11 (minor). Also, the kiosk shows the same Menu as the officer pages (the brief asks for one header everywhere). The PHP version should hide officer pages behind a login so the door tablet can't open them.
