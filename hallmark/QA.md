# QA: Hallmark "Whiteprint" direction

How it was checked: screenshots at 1280x800 (laptop), 390x844 and 360 wide (phone) and 768x1024 (tablet kiosk), plus a scripted run in headless Chrome that clicked through every JS state: sign in, visitor sign in, new student number, bad number, sign out and undo, approve, the not-enough-stock block, reject without and with remarks, mark returned, new request lines, restock, duplicate item, member without student_id, attendance filters, settings duplicates. All states behaved as expected after the fixes below.

Severity: **Blocker** (can't finish the task), **Major** (wrong or unsafe result, or a rule broken), **Minor** (friction).

## 1. Mika, member, at the door with one hand full
- Sign in is one screen: student number, a purpose tile, one red button at full width (56px). Tiles are 60px tall. Fast enough with a thumb.
- "Welcome back, Mika Reyes" shows while she types, so she knows the number was right.
- Confirmation is a green box at the top of the form with her name, purpose and time, and focus moves to it.
- **Major:** she could sign in again while she was already inside, creating a second open attendance row. Fixed.
- **Major (bug):** after the first message, the message box lost its own CSS class, so a second action on the same box could fail (found by the scripted run on Requests). Fixed.
- **Minor:** on the phone the page title block pushed the form down by about 280px. Fixed: the door page hides the table/sheet cells under 760px.
- **Minor:** the "Sign out (4 inside)" switch rendered as "4inside" (flex ate the space). Fixed.
- **Minor:** the student number uses a text keyboard because the PUP number has letters (MN). Left as is.

## 2. Visitor from another school, Workshop
- "Visitor / No PUP student number" is the second tile. Picking it swaps the student number field for first name, last name, contact and school. Every field says "Required for visitors." if left empty.
- **Minor:** the choice tiles drew square boxes for one-pick radios, so they looked like checkboxes. Fixed: round markers.
- No other issues.

## 3. Paolo, officer, on his phone
- Pending requests come first. Approve opens an inline "Yes, approve #1041" step with a summary of what goes out, so a stray tap does not approve.
- #1042 (4 cutting discs, 3 available) shows "Only 3 available" before he taps anything. Tapping Approve gives a red message naming the item, the quantity asked for and what is available, and does not approve.
- Approved quantities come out of the in-page stock, so a later approval is checked against what is left.
- Reject needs a remark ("Add a remark so the member knows why.").
- His own #1044 has no buttons, just a note that another officer decides it (chk_request_not_self).
- The overdue torque wrench row is red-tinted with "! Overdue 3 days". Mark returned works.
- **Minor:** the "Your own request..." note ran off the screen at 390px (nowrap on tags). Fixed.
- **Minor:** in stacked rows the borrower's student number and phone fell into the label column. Fixed.
- **Minor:** Mark returned has no undo. Left: returns are rare to mis-tap and the PHP version can add an undo.
- **Minor:** an approved request doesn't appear under Open loans in the prototype (the message says so). Left for PHP.

## 4. Inventory officer at a laptop
- Add item: name, category, a tool/consumable choice that says what each means, quantity_total with a hint, optional reorder_level. A duplicate name gives an error (uq_item_name).
- Restock only lists consumables and says why ("To own more tools, edit the tool's quantity_total"). Restocking solder wire by 5 updates quantity_available and clears the low-stock flag.
- Low stock: red-tinted rows, "! Low stock" tags, a "Low stock only" filter, and a count on the dashboard.
- **Minor:** the restock dropdown kept showing the old "2 left" after a restock. Fixed.

## 5. Sir Espineli, DBA professor
- Every page opens with a title block naming the tables and views it reads and writes, plus one rule it enforces.
- Labels and table heads use the real column names (student_id, quantity_available, reorder_level, requested_at, due_date, can_approve...).
- Reports shows six queries with the result next to its SQL, using v_open_loans, v_low_stock, joins, GROUP BY and DATEDIFF.
- These rules are visible in the UI: members need a student ID (People form error), visitors can't be members (People list, kiosk), consumables have no due date (request form, item types), nobody approves their own request (#1044), only can_approve roles decide (Settings), and the stock check that the database doesn't do (Requests).
- **Minor:** time_out > time_in isn't something a user can break here, because time_out is always NOW(). It is named in the Attendance title block.
- **Open question for Rico:** the Adviser role needs a member row, and a member needs a student_id, so a faculty adviser can't be added as written. No adviser is in the sample data for this reason.

## 6. Sir Cadaoas, UI rules
- Limited palette, hex variables in :root, red only on primary buttons and alerts, status always text + icon. Contrast: ink on white about 18:1, muted #5B6270 on white about 6:1, white on red about 5:1.
- Two fonts: Chakra Petch (headings) and IBM Plex Sans (everything else). The SQL blocks use the system's Consolas, which is code, not a third design font.
- 16px body, fixed h1/h2/h3 sizes, one style.css, the same header on all 8 pages with the current page underlined and marked aria-current.
- Labels, hints and errors on every form. Logo alt, favicon, titles per page. Visible focus ring on everything.
- No issues.

## 7. Hans, rebuilding in PHP
- Plain HTML, one CSS file using Flexbox, simple Grid and media queries, and one app.js of plain functions with comments. No frameworks or build step.
- Form ids and labels match the columns, so `name="..."` attributes and `$_POST` keys map one to one.
- The header and footer are identical on every page and go straight into header.php and footer.php (only aria-current changes).
- **Minor:** the prototype keeps stock in a hidden `<ul id="stock-data">`. In PHP this becomes a SELECT on v_item_stock. Noted in NOTES.md.

## 8. Accessibility (keyboard + screen reader)
- Skip link, landmarks, one h1 per page, labelled sections, native radios under the tiles, a visible focus ring on tiles and inputs.
- Errors are linked with aria-describedby and marked aria-invalid. Messages are in role=status or role=alert, and focus moves to them after an action.
- Repeated buttons ("Sign out", "Edit", "Mark returned", "Deactivate") carry the person or item in visually hidden text.
- Tables keep real headers, and the stacked phone rows show the header as a label.
- **Minor:** filter changes don't announce how many rows match. Left.

## Fix list (de-duplicated)
| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Already-inside person could sign in twice | Major | Fixed (kiosk checks for an open row, points to Sign out) |
| 2 | say() replaced the box's classes, which broke repeat messages | Major | Fixed |
| 3 | Menu button showed on laptop (.btn overrode .menu-btn) | Major | Fixed |
| 4 | Door title block too tall on phone | Minor | Fixed |
| 5 | "4inside" spacing in kiosk switch | Minor | Fixed |
| 6 | Square radio markers looked like checkboxes | Minor | Fixed |
| 7 | Tag text overflowed at 390px | Minor | Fixed |
| 8 | .sub lines misplaced in stacked rows; emails overflowed at 360px | Minor | Fixed |
| 9 | Reports results cramped beside SQL at 1280 | Minor | Fixed (3:2 split, stacks under 1100px) |
| 10 | Restock dropdown showed old stock | Minor | Fixed |
| 11 | No undo for Mark returned | Minor | Open |
| 12 | Filter result count not announced | Minor | Open |
| 13 | Adviser vs student_id rule | Question | For Rico |
| 14 | Kiosk device can reach officer pages through Menu | Major for PHP | Open: needs login in PHP (see NOTES.md) |

## After fixes
- Re-ran the scripted click-through: every state passes, including the new "already signed in" error, duplicate purpose and category, and restock.
- Re-shot laptop Reports (results readable on one line, SQL beside them) and the door at 360px (compact title, round radios, "Sign out (4 inside)" readable, no horizontal scroll). Earlier shots confirmed the tablet kiosk at 768 and the Requests and People pages on phone.
- sloplint (app scope): the only FAIL is the missing Hallmark stamp, which the brief forbids. The one REFLEX (38iii) is a false positive on a border rule. The rest are warnings: visually hidden button text, straight apostrophes, meta description.
