# QA: "Time Card" direction (superdesign)

How it was checked: laptop screenshots at 1280×800 (kiosk, dashboard, requests, reports), phone at 390×844 and 360×800 (kiosk, rack jump, requests, items, reports). Behaviour was run in headless Chrome with scripted taps on every page (kiosk punch in/out, double sign-in, visitor, first-timer; approve/reject/return; add item, restock, edit; add person, make member; filters; settings lookups). Overflow and tap sizes were measured on all 8 pages in 360 px and 768 px frames.

Severity: **Blocker** stops the task, **Major** likely mistake or rule broken, **Minor** polish.

## 1. Mika, member, at the door with one hand full
- Number pad is 60 px keys, digits auto-format to `2023-00118`, her name shows as soon as 9 digits are in. Purpose tiles are 56 px. Confirmation is a big stamped card `IN 11:05 AM` with her name and purpose, and it resets by itself after 8 s. Good.
- Second punch in shows "Mika Reyes is already punched in (since 11:05 AM). Punch out instead", with the button focused. Good.
- Punch out is one tap with Undo for 6 s, card shows `OUT` stamp. Good.
- **Major:** on a phone, Punch in is about two screens below the pad (pad, then six tiles, then the button). She has to scroll with a full hand.
- **Major:** the "Signing out? Find your card" jump landed with the heading hidden under the sticky top bar.
- **Minor:** the placeholder `2023-00118` looked like a number already typed in.
- **Minor:** rack hint said "Tap your card", but only the button punches out.

## 2. Visitor from another school, here for a Workshop
- "Visitor (no PUP number)" is the second big choice; the number pad disappears and name, contact and "School or organization (required for visitors)" appear. Missing fields get an error with icon and text each. Good.
- PUP students not in the system yet type their number and get "New here: add your name below" instead of a dead end. Good.

## 3. Paolo, officer, on his phone
- Slips show each line with "2 on the shelf" or "Only 1 on the shelf" before he taps anything.
- Approve on #1041 (2 multimeters, 1 on the shelf) is refused with: "Can't approve yet. Digital multimeter: 2 asked, only 1 on the shelf. Wait for a return, or reject it with a reason." Good.
- Approve and Mark returned both need a second tap ("Tap again to stamp APPROVED"), which resets after 4 s. Reject opens a required reason box; empty reason is refused. Good.
- Approved quantities come off the shelf and every slip re-checks: approving #1043 drops the calipers; returning a multimeter makes #1041 approvable. Tool lines move to Out on loan. Consumables-only slips stamp `COMPLETED`. Good.
- His own slip #1044 has no buttons and says why. Overdue is first in Out on loan with a red `OVERDUE 3 DAYS` stamp, and the jump bar counts it. Good.
- **Minor:** the armed-button text change isn't announced to screen readers (see 8).

## 4. Inventory officer at a laptop
- Add item: picking Consumable relabels the quantity to "Starting stock"; duplicate names are refused (`item.name` is UNIQUE). The new item appears in the table and in the Restock list. Good.
- Restock solder wire +5: available goes 2 → 7, the low-stock banner drops it. Restock only lists consumables, with a hint why (the view adds restocks to consumables only). Good.
- Low stock shows as a red banner at the top plus a `LOW STOCK` stamp on the row (icon + text). Good.
- **Minor:** in the New request form (same officer on Requests), the item select was squeezed to "Choose an" at laptop width.
- **Major (all users on a laptop):** a white "Menu" button showed in the sidebar on desktop, where the nav is already open.

## 5. Sir Espineli (Database Administration)
- Every panel has a comment naming its table/view, and the lead text names `v_item_stock` / `v_low_stock`. Form field names are the SQL columns.
- Reports shows 6 queries beside their results: open loans, overdue, low stock, in the HQ now, attendance per day/purpose (GROUP BY), most borrowed (JOIN + SUM). Section 7 lists each trigger/CHECK and where the screens show it, including the known gap (approving over stock), which the UI covers.
- Visible rules: visitors can't be members (checkbox disabled until a student number; Rina's row says why), consumables have no due date (field empties and locks), no self-approval (#1044), one line per item per slip (duplicate refused).
- **Minor (schema, not UI):** the Adviser must have a student ID because of `trg_member_requires_student_id_ins`. Sample uses an alumni number; worth raising with Rico.

## 6. Sir Cadaoas UI rules
- Palette: white, #F4F5F7, #14161A, #5B6270, charcoal sidebar; red only on primary buttons and on alerts that need action (overdue, low stock, can't-approve). Contrast checked: muted on white 6.1:1, muted on gray 5.6:1, white on red 5.0:1, dark red on red tint 6.1:1, input borders 3.3:1.
- Two fonts (IBM Plex Sans, IBM Plex Mono), 16 px body and table text, fixed h1/h2/h3, CSS variables, one style.css, same sidebar on all 8 pages with `aria-current` highlight, logo + favicon + page titles, labels/hints/errors on forms, alt text, focus ring.
- Measured: no sideways scroll at 360 or 768 on any page (after one fix below), no tap target under 44 px.
- **Major:** at 360 px, two long status sentences ("This is your own request…", "Can't be a member: no student number") were `nowrap` and pushed the page 90–105 px wide.

## 7. Hans, rebuilding it in PHP
- Plain HTML, one stylesheet, one script of named functions with comments, no frameworks or build. Sidebar and header are marked for `sidebar.php` / `header.php`.
- Request lines post as `item_id[]`, `quantity[]`, `due_date[]`. The consumable due date is `readonly` and empty (not `disabled`), so the three arrays always stay the same length. Good catch to keep.
- Select values are ids (`category_id`, `role_id`, `purpose_id`, `requested_by`).
- **Minor:** Approve/Reject/Mark returned are JS buttons, not forms. Documented in NOTES: each becomes a small POST form with `request_id` / `line_id`.
- **Minor:** the kiosk posts `student_id` as typed (`2023-00118`), so the lookup needs `LIKE '2023-00118%'`. Documented.

## 8. Accessibility tester
- Skip link, landmarks, one h1 per page, labelled inputs, radio tiles are real radios in a fieldset, pad Delete has an aria-label, toast is `role="status"`, Menu has `aria-expanded`, status never relies on colour.
- **Major:** field errors set `aria-invalid` but weren't linked to the field, and focus stayed on the submit button, so a screen-reader user heard nothing after a failed submit.
- **Minor:** armed state of Approve / Mark returned was silent.

## Fix list (de-duplicated)
| # | Severity | Fix | Status |
|---|---|---|---|
| 1 | Major | Hide the sidebar Menu button on desktop (`.btn` was overriding `display:none`) | Fixed |
| 2 | Major | Let long status sentences wrap; no sideways scroll at 360 | Fixed |
| 3 | Major | Anchor jumps land below the sticky top bar (`scroll-margin-top`) | Fixed |
| 4 | Major | Phone kiosk: when the number matches, scroll the purpose tiles and Punch in into view | Fixed |
| 5 | Major | Link errors with `aria-describedby`; move focus to the first bad field after a failed submit | Fixed |
| 6 | Minor | Announce "Tap the button again to confirm" through the status region | Fixed |
| 7 | Minor | Request line: item select gets a full row; qty / due / remove under it | Fixed |
| 8 | Minor | Kiosk placeholder `0000-00000` in a lighter grey | Fixed |
| 9 | Minor | Rack hint: "Tap Punch out on your card" | Fixed |
| 10 | Minor | Adviser needs a student ID (schema) | Open, for Rico |
| 11 | Minor | New request doesn't add a slip to Pending in the prototype (toast only) | Open, PHP does it |

## After fixes
- Re-ran all scripted flows: kiosk (punch in, double sign-in blocked, punch out + undo, visitor errors, first-timer), requests (blocked approve with message, two-tap approve, reject needs reason, return re-enables #1041, form errors), items, people, attendance, settings: all pass.
- Re-measured 8 pages at 360 and 768: no element past the right edge, no tap target under 44 px.
- Re-shot laptop Requests (Menu button gone, request line readable) and phone kiosk jump (heading lands below the top bar).
- Not re-checked with a real screen reader; the checks above are from the markup.
