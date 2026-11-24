# QA: Scrutineering (web-design-engineer)

Checked on 2026-11-24 with headless Chrome: laptop 1280×800, phone 390×844 and 360×800, tablet 768×1024. Also a scripted run of 18 flows (kiosk, requests, people, items) and an automatic sideways-scroll and font-size check of all 8 pages at 360px.

Severity: **Blocker** (task can't be done or done wrong), **Major** (confusing or risky), **Minor** (polish).

## 1. Mika, member, at the door with one hand full
- Typing `2023001010` on the number pad reads back as "2023-00101-MN-0 · Mika Santos" right away, and the checklist ticks PASS. Purpose tiles are 56px tall, Sign in is 64px. Confirmation is a big "Signed in 11:59 AM" stamp with her name, and it clears itself after 8 s. Good.
- Trying to sign in again is blocked ("Mika is already inside since …. Sign out first.") with a link to the list. Good.
- **Major:** on a phone the page title, lede and sample note pushed the student number field to the bottom of the first screen.
- **Minor:** "Leaving? Jump to Sign out(4 inside)" had no space.

## 2. Visitor from another school, for a Workshop
- "Visitor, no student number" is one of two big choices at the top, and swaps in name, contact and school. A NOTE line explains that visitors are saved with no student number, so they can't become members. Clear.
- Someone already inside with the same contact number is blocked.
- Open, not fixed: a returning visitor creates a new `person` row each visit (see NOTES).

## 3. Paolo, officer, on his phone
- Every pending request has an inspection list. Paolo's own No. 0012 FAILs `chk_request_not_self`. No. 0014 FAILs on stock (Angle grinder, 0 available), so Approve is greyed out. Tapping it shows the reason instead of doing anything.
- Approve, Reject and Mark returned need a second tap ("Tap again to approve"). Reject needs a reason first. Approving No. 0013 takes the last multimeter, so No. 0015 becomes blocked straight away. Returning Jun's grinder unblocks No. 0014. All covered by the scripted run.
- Overdue loans are red rows with an "⚠ Overdue" stamp, listed first.
- **Major:** Reject was still open on his own request. It opened the reason box and only refused at the end.
- **Major:** on the dashboard his own request said "waiting · Decide", which he can't do.
- **Minor:** the stock FAIL didn't say what to do next. Approve and Reject were narrow on phones.

## 4. Inventory officer at a laptop
- Adding a consumable: the checklist covers a unique name (`uq_item_name`), category, total ≥ 0, and a NOTE if no reorder level is set (it would never show as low). A duplicate name is refused.
- Restock lists consumables only, with a hint explaining why: `v_item_stock` ignores restocks for tools. Restocking solder wire by 10 clears the low-stock notice and the red row.
- Low stock shows in three places: the red notice above the table, row stamps, and the dashboard.
- Editing a tool's total below the units out on loan is a FAIL.

## 5. Sir Espineli (DBA professor)
- Every page header says which tables and views it's "checked against". Column headers and labels carry the real column names. Every checklist line names its trigger or constraint.
- Reports: 6 queries with the real SQL beside live results (`v_open_loans`, overdue, `v_low_stock`, attendance per day and purpose, most borrowed, who is inside). There's also a business-rules table mapping all 11 rules to where the UI checks them, including the over-approval gap that the DB doesn't block.
- Rules are visible: visitors shown as `NULL (visitor)` with "can't be a member", consumables "no due date" on request lines with the due field disabled, and the Out on loan list holds tools only.

## 6. Sir Cadaoas UI rules
- Two fonts (Atkinson Hyperlegible, JetBrains Mono), hex CSS variables, ONE style.css, the same sidebar on all 8 pages with the current page highlighted (white bar, red edge, `aria-current`). Red is used only for primary buttons and FAIL or alert states. Statuses always pair an icon with a word. Body and table text are 16px.
- Contrast: muted `#5B6270` on band `#E9EBEF` is about 4.7:1, and `#B01E17` on `#FCEDEC` is about 6:1.
- **Minor:** table header labels were 14px. Now 16px.
- **Bug (Major):** the Menu button showed on the desktop sidebar because `.btn` overrode `.menu-btn`.

## 7. Hans, rebuilding in PHP
- Plain HTML, one stylesheet, one `app.js` of commented functions with no libraries or modules. Form `name`s equal the SQL columns. Each `render…` function equals one SELECT plus a PHP loop. `esc()` mirrors `htmlspecialchars`.
- Rows are drawn by JS from sample arrays rather than hard-coded in HTML. That's easier to keep consistent, and NOTES maps each array to its query.

## 8. Accessibility (keyboard and screen reader)
- Skip link, visible 3px focus ring, labels on every input, errors linked with `aria-describedby`, and focus moves to the first bad field. Radio tiles are real radios in a fieldset with a legend. Checklist lines start with sr-only "Passed: / Failed:". Toasts are `aria-live`. Blocked buttons stay focusable (`aria-disabled`) and point to their reason.
- **Major:** the two-tap "Tap again" state changed the button text silently for screen readers.

## Fix list (de-duplicated)
| # | Severity | Fix |
|---|---|---|
| 1 | Major | Menu button visible on desktop: scope the rule to `.sidebar .menu-btn` |
| 2 | Major | Phone kiosk: hide the lede and sample note under 760px so the form starts higher |
| 3 | Major | Own request: Reject also `aria-disabled`, with the `chk_request_not_self` reason |
| 4 | Major | Dashboard: own request shows as "your own request, another officer decides" |
| 5 | Major | Two-tap state announced through an assertive sr-only live region |
| 6 | Minor | Stock FAIL text adds "reject with a reason, or wait for a return" |
| 7 | Minor | Approve and Reject fill the width on phones (52px tall) |
| 8 | Minor | Table header text 16px |
| 9 | Minor | Missing spaces in "Pending (4)" and "Sign out (4 inside)" |
| 10 | Minor | Dashboard figure caption `v_open_loans.is_overdue` broke mid-word; shortened to `is_overdue = 1` |

## After fixes
All 10 are fixed. Re-checked:
- The 18 scripted flows all pass.
- At 360px all 8 pages have scrollWidth ≤ viewport and no table cell under 16px.
- Laptop: the desktop sidebar has no Menu button.
- Phone kiosk: the student number field is in the first screen, under the Sign out jump.
- Phone requests: the blocked card explains itself and the buttons are full width.

Still open (not blockers):
- Returning visitors get a new `person` row each time.
- Officers can't sign out a forgotten "still inside" row from the Attendance page; only the kiosk list can.
- Fonts load from Google Fonts. Offline, it falls back to Segoe UI and Consolas.
- Nothing persists between pages (a prototype; PHP adds the database).
