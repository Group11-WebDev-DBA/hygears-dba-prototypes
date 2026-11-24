# QA: "Shadow Board" (frontend-design direction)

Checked 2026-11-24 with headless Chrome at 1280x800 (laptop), 768x1024 (tablet kiosk) and 360/390 wide (phone), plus scripted click-throughs of every form and button on the kiosk, Requests, Items and People pages (results read back from the DOM). Severity: **Blocker** (can't do the job), **Major** (slow, risky or confusing), **Minor** (polish).

## 1. Mika, member, at the door with one hand full
- Tiles are 64px, inputs 56px, Sign in is full width and red. Tag board has one Sign out per person. Good.
- **Major:** the student number needed letters and dashes (`2023-00141-MN-0`), so on a phone she had to switch keyboards twice with one thumb.
- Signing in while already inside is refused, says when she signed in, and offers "Show my tag". Good.
- Sign out shows "Signed out: Mika Reyes at 10:02" with Undo. Good.
- **Minor:** on a phone the tag board is below the form. The "Leaving? Find your tag (4 inside)" button covers it.

## 2. Visitor from another school
- "No, I'm a visitor" swaps the student number for first name, last name, contact number and school. Clear.
- A returning visitor is matched by contact_number, so no second person row gets made, and the kiosk says she's already inside if she is. Good.
- **Minor:** on a tablet the "Yes, PUP student" tile wrapped awkwardly under its tick.

## 3. Paolo, officer, on his phone
- Approve takes two taps: Approve, then "Yes, approve" after a sentence saying exactly what will be lent or issued. Reject needs a reason (remarks). Good.
- Not enough stock: the slip turns red with "Only 3 available" before he taps anything, and Approve explains: "Can't approve #1042. It asks for 4 Cutting disc 4 in, but only 3 left in stock (quantity_available). Restock first, or reject it…" Good.
- Approving #1041 drops multimeters from 2 to 1, and #1045 (asks for 2) turns red right away. Returning Mika's two multimeters unblocks it again. Approved amounts are tracked against stock.
- **Major:** "Mark returned" fired on one tap, so a stray tap on a phone put a tool back on the wall with no undo.
- **Major:** on a phone the overdue loans sit below 5 slips and the 11-item stock list, a long scroll.
- **Minor:** the message said "only 1 are on the wall".

## 4. Inventory officer at a laptop
- The low-stock rows are tinted, the bin gauge goes red with the reorder mark shown, and the status reads "! Low stock". "Low stock only" filters to the 2 rows.
- Restocking 5 solder wire shows "now 7 available. It's no longer low stock." The restock list only offers consumables, and says why.
- Adding "Zip ties 200 mm" works, and a duplicate name is refused (uq_item_name). Lowering a tool's quantity_total below the number out on loan is refused.
- **Minor:** editing an item replaces its subtitle with just the category, so the unit ("rolls") is dropped.

## 5. Sir Espineli (Database Administration)
- Every officer page names its tables and views under the title. Table headers use the column names. Reports shows six queries, each with its SQL next to the result: v_open_loans, overdue, v_low_stock, attendance by day and purpose, most borrowed, and who is inside.
- Rules you can see: members need a student_id (People form error uses the trigger's wording), visitors without one can't be made members, consumables have no due date (the field switches off), nobody decides their own request (#1044 has no buttons), can_approve on Settings, and the stock check the DB doesn't do.
- **Minor:** "Most borrowed" called SUM(quantity) `times_out`, but it counts units, not loans.
- **Open (schema):** an Adviser must be a member, and a member needs a student_id, so a faculty adviser can't be stored. That's for Rico.

## 6. Sir Cadaoas / UI rules
- Limited palette, red only for primary buttons and alerts, status always has a glyph and words. Two fonts (Saira Condensed, Public Sans). SQL uses the system's Consolas. CSS variables, one style.css, the same rack/nav on every page with the current tag filled, and labels, hints and errors on every form. Focus ring is visible.
- **Minor:** table text was 15px. The rule says 16px body.
- **Minor:** the logo had empty alt text. That's correct for screen readers because "Hygears HQ" sits next to it, but it reads as missing on the checklist.

## 7. Hans, rebuilding in PHP
- Plain HTML. Form `name` attributes match the columns (student_id, first_name, purpose_id, item_id, quantity, due_date, restocked_on…). app.js is plain functions, and each "save" has a comment with the SQL it stands for. The shared header is marked "becomes header.php".
- **Minor:** the request form's item lines come from a `<template>` that JS clones. In PHP he can loop over items in the markup instead.

## 8. Accessibility (keyboard + screen reader)
- Skip link, real radio buttons under the tiles, fieldset and legend, aria-live messages, role=alert on stock problems, hidden names on every repeated button ("Sign out Lara Gomez"), and focus moves to each result message.
- **Major:** the sign-out message had no tabindex, so focus was lost when a tag was removed from the board.
- **Minor:** under 640px the reflowed tables use display:block, which can drop table semantics in some screen readers. The labels are still read from `data-label`.

## 9. Bug found while testing
- **Major:** on the kiosk, if a first-time number opened the name fields and the person then corrected it to a known number, Sign in still asked for a name and contact.

## Fix list (de-duplicated)
| # | Severity | Fix |
|---|---|---|
| 1 | Major | Student number accepts just the 9 digits (`2023 00141`) on a number pad, and the kiosk adds `-MN-0`. The full format still works. |
| 2 | Major | Mark returned takes two taps ("Tap again to confirm"). |
| 3 | Major | Requests gets jump links at the top: Pending, Tools out (1 overdue), New request. |
| 4 | Major | Sign-out message is focusable, so focus lands on "Signed out… Undo". |
| 5 | Major | A corrected student number hides the first-visit fields and signs in normally. |
| 6 | Minor | Yes/No tiles read "Yes" / "No, I'm a visitor", so nothing wraps on a tablet. |
| 7 | Minor | Stock message grammar ("only 1 on the wall"). Approve message in past tense ("lent… issued…"). |
| 8 | Minor | `times_out` renamed `units_out`. |
| 9 | Minor | Table text 16px. Logo alt "Hygears logo". |
| 10 | Minor | Phone tables put the name first and hide empty cells. The date filter option is shortened to "Today". |
| 11 | Minor | Item unit dropped on edit. Not fixed (needs a unit column the schema doesn't have). |
| 12 | Minor | Reflow table semantics. Not fixed (acceptable at class level, PHP can keep it). |

## After fixes
- Re-ran the kiosk script: `2023 00141` finds Mika and is refused as already inside. `202500456` opens first-visit fields, then signs in Rina. Changing the number to `2022 00512` signs Bea in with no name prompt. `2025` alone gives "Type the 9 digits on your ID". Lara as visitor is refused as already inside. Sign out and Undo move the count 6 to 5 to 6.
- Re-ran the requests script. #1042 is blocked with the message. Approving #1041 blocks #1045. The first Mark returned tap shows "Tap again to confirm", and the second returns the tool, unblocks #1045 and completes #1038. Reject without remarks is refused. A new request refuses a duplicate item and a tool with no due date, and the consumable due date switches off.
- Re-shot the phone kiosk at 360, the tablet kiosk at 768 and phone attendance at 360. No horizontal scroll, the tiles fit, and the names lead each reflowed row. The laptop pages are unchanged apart from 16px table text.
- Still open: #11, #12. The kiosk shows the officer nav on the door tablet: the PHP version must put officer pages behind a login, and the door device opens only index.html. The kiosk assumes the -MN-0 campus code. Branch-campus students can't type letters on the number pad, so they need an officer to add them, or a campus picker in the PHP version.
