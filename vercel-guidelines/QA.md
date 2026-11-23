# QA: "Vercel guidelines" direction

Method: screenshots at 1280×800 (laptop), 390×844 (phone), 768×1024 (tablet) and 360 wide (smallest phone), plus scripted runs of every flow in headless Chrome: kiosk sign in and out, approve, reject, the not-enough-stock block, mark returned with Undo, new request, add item, restock, edit item, add person, member rule, lookups, URL filters. I also reviewed the files against the bundled Web Interface Guidelines (`command.md`).

Severity: **Blocker** (task can't be done), **Major** (done, but slow, unsafe or wrong), **Minor** (polish).

## 1. Mika, member at the door, one hand full
- OK: purpose tiles and buttons are 52–60 px tall. Her name shows live as she types ("✓ Mika Santos, Member"). The confirmation screen gives her name, purpose and time, then resets after 8 s. Sign Out has a 7 s Undo.
- **Major**: on a phone, signing out means scrolling past the whole sign-in form to reach "In the HQ Now".
- **Minor**: typing `2023-00101-MN-0` one-handed is slow (letters force the full keyboard).
- **Minor**: if she is already inside, the error explains it and points her to Sign Out below. Good.

## 2. Visitor from another school (Workshop)
- OK: the PUP Student / Visitor switch is the first choice. The visitor form says no student number is needed, and each field has a label, a hint and an error.
- **Minor (open)**: a returning visitor creates a second `person` row. The PHP version should match on `contact_number` first.

## 3. Paolo, officer, on his phone
- OK: request #1012 shows the reason before he taps: "Not enough stock: Digital multimeter asks for 2, only 1 available. Reject with a reason, or wait for a return." Tapping the dimmed Approve repeats it, and it never approves. Approve and Reject open a confirm dialog with Cancel focused, so a stray tap or Enter does nothing. Reject asks for remarks. Overdue rows are tinted and labelled "! Overdue". Mark Returned has Undo, and a return re-checks pending requests (returning the multimeters unblocks #1012).
- OK: his own request #1014 can't be approved or rejected (chk_request_not_self), and the page says so.
- **Major**: stacked mobile rows put the name and its sub-line side by side, so "Mika Santos  Member" looked like two values.
- **Minor**: the own-request note was in alarm red, though nothing is wrong with it.
- **Minor**: after Approve, Reject or Return, the clicked button disappears and keyboard focus fell back to the page top.

## 4. Inventory officer at a laptop
- OK: adding a consumable checks that the name is unique (uq_item_name), that a category and type are chosen, and that the quantity is ≥ 0. Restock updates Available and clears the low-stock flag (3 → 8). The "Low stock only" filter is kept in the URL (`items.html?low=yes`), and the dashboard links to it.
- **Major**: a consumable added this session didn't appear in the Restock list, so the officer couldn't restock it without reloading.

## 5. Sir Espineli (DBA)
- OK: every page lists the tables and views it reads or writes. Every column header and form label shows the real column (`quantity_available`, `time_out`, `can_approve`…). Reports shows 6 queries over `v_open_loans`, `v_low_stock`, `attendance` and `request_line`, each next to its SQL. The sample results match the sample data (averages recomputed).
- Rules visible in the UI: members need a student ID (the People checkbox refuses without one, citing the trigger); consumables have no due date (the due-date field is disabled, citing the trigger); nobody decides their own request; only can_approve roles decide (sidebar shows `can_approve = 1`, Settings shows the flag); approving more than `quantity_available` is blocked in the UI.
- **Minor (open, for Rico)**: the Adviser is a member, so the trigger requires a `student_id`. The sample uses a faculty number (`FAC-2019-0042`). Decide whether that's allowed or whether advisers need a different rule.

## 6. Sir Cadaoas UI rules
- OK: the palette is white, gray, near-black, secondary gray and one red, used only on primary buttons and alerts. Text contrast is ≥ 4.5:1 (muted 6:1 on white, white on red 4.9:1, dark red on pink 5.9:1). Two font stacks (system sans + monospace). CSS variables, one style.css, the same sidebar with the current page highlighted, favicon, page titles, alt text, focus rings, and labels, hints and errors on every form.
- **Minor**: tables were 15 px, below the 16 px body rule.
- **Minor**: a few inline `style=""` attributes (clean-code rule).
- **Minor**: purpose tiles overflowed their panel on a 768 px tablet (3 columns too narrow).

## 7. Hans, rebuilding in PHP
- OK: plain HTML, one CSS file, and one commented app.js with plain functions. Form `name` attributes are the SQL column names. The sidebar is one block marked "becomes header.php". `esc()` mirrors `htmlspecialchars`, and comments show the matching INSERT/UPDATE.
- **Minor**: the kiosk posted purpose names, not `purpose_id`.
- **Minor**: `isTool()` uses a sample id range. It's marked `shortcut:`; PHP reads `item.item_type`.

## 8. Accessibility (keyboard + screen reader)
- OK: skip link; one h1 per page; th scope; labelled dialogs; aria-live toasts and filter counts; status by text + icon, never colour alone; aria-invalid with errors linked by aria-describedby; focus on the first error on submit; a visible keyboard focus ring; `prefers-reduced-motion` respected; zoom not blocked.
- **Minor**: on mobile, the sticky header could cover a focused field.
- **Minor (open)**: Undo toasts vanish after 7 s. That's fine for a mouse, but tight for screen-reader users. The PHP version could keep the last action in a "Recent" list.

## Fix list (de-duplicated)
| # | Fix | Sev | Status |
|---|---|---|---|
| 1 | Kiosk phone: "Leaving? Go to Sign Out" button at the top (hidden on tablet, where the list is beside the form) | Major | Fixed |
| 2 | Mobile stacked rows: label floats left, cell content stacks right (name above sub-line) | Major | Fixed |
| 3 | New consumable is added to the Restock list | Major | Fixed |
| 4 | Kiosk accepts the 5 middle digits (`00101`) when exactly one person matches | Minor | Fixed |
| 5 | Own-request note shown as a grey hint, not red | Minor | Fixed |
| 6 | Focus moves to the table heading after Approve/Reject/Return | Minor | Fixed |
| 7 | Tables at 16 px; time cells don't wrap | Minor | Fixed |
| 8 | Inline styles replaced by `.mt` / `.narrow` classes | Minor | Fixed |
| 9 | Purpose tiles: 2 columns up to 1024 px; radios no longer shrink | Minor | Fixed |
| 10 | Kiosk posts `purpose_id` | Minor | Fixed |
| 11 | `scroll-padding-top` under the sticky mobile header | Minor | Fixed |
| 12 | Curly apostrophes in visible text (guideline: typography) | Minor | Fixed |
| 13 | Returning visitor dedupe; adviser student_id rule; longer Undo window | Minor | Open (PHP / Rico) |

## After fixes
- Re-ran every scripted flow after the fixes. Kiosk sign-in with `00101` → Mika; the duplicate-sign-in error; visitor sign-in; Sign Out + Undo. #1012 blocked with the stock message. #1013 approved through the dialog (pending 3 → 2, a loan row added). #1012 rejected with remarks; Cancel leaves it pending. A return unblocks #1012, and Undo re-blocks it. Restock 3 → 8 clears Low. Add/edit item, add person with the member rule, lookups with the duplicate check, and URL filters all pass. `node --check app.js` passes.
- Phone 390: the requests rows now read label-left / value-right with the name above "Member". The kiosk shows the Sign Out jump button. At 360: the inventory filters stack with no horizontal scroll. Tablet 768: purpose tiles fit in 2 columns, with Sign Out buttons beside the form. Laptop: dashboard, requests and reports unchanged in look.
