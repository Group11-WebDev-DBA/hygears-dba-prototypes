# Ledger (taste direction)

The paper logbook, made digital. White sheets and hairline rules. Every record number, time and student number is set in a monospace face, like the lines of a logbook. The memorable part: **every form label prints its SQL column next to the plain words** ("Student number `person.student_id`"), and every panel names the table or view it reads. The screens double as the data dictionary for the DBA grade.

## Palette (hex variables in `style.css`)
| Token | Hex | Use |
|---|---|---|
| `--white` | #FFFFFF | sheets, inputs |
| `--gray` | #F4F5F7 | page background, table heads |
| `--ink` | #14161A | text, the selected tab underline, the focus ring |
| `--muted` | #5B6270 | secondary text, column names |
| `--red` | #D7261E | primary buttons and need-action alerts only |
| `--charcoal` | #1B1D22 | header bar with the HG mark, SQL boxes |
| `--line`, `--line-strong` | #DADDE2, #AEB3BC | hairlines, input borders |

## Fonts
Instrument Sans (UI and headings, 400/500/600) and DM Mono (ids, times, student numbers, SQL). Both load from Google Fonts with Segoe UI / Consolas as fallbacks, so the pages still work offline. The pairing was dealt by the taste skill for a software product.

## How it differs from vercel-guidelines
That direction uses a charcoal sidebar and a system font. Ledger uses a charcoal top bar, a white tab row with an ink underline, Instrument Sans + DM Mono, column names on labels, and the stat strip as one ruled row (no cards).

## Screens
`index.html` kiosk · `dashboard.html` · `attendance.html` · `people.html` · `items.html` · `requests.html` · `reports.html` · `settings.html`. One `style.css`, one `app.js` (vanilla, no modules). Open any page by double-click.

## For the PHP rebuild (Hans)
- The header and footer are marked in every page as the future `header.php` / `footer.php`. Set `aria-current="page"` from the current file name.
- Form `name=` attributes are the SQL column names. `data-*` attributes carry the ids and numbers PHP prints from the database (`data-available` comes from `v_item_stock.quantity_available`).
- Each action in `app.js` has its SQL in a comment above it. In PHP, these become POST handlers with prepared statements, and the same checks run on the server:
  - Kiosk sign in: look up `person` by `student_id`, refuse if an open `attendance` row exists, then INSERT with `time_in = NOW()`. Sign out: UPDATE `time_out = NOW()`.
  - Approve: re-read `v_item_stock` inside a transaction and refuse if any line asks for more than `quantity_available`. The database doesn't block this.
  - Decide: `decided_by` is the session user. The triggers already refuse non-approvers and self-approval.
  - New request: tools need `due_date`; consumables send NULL (the trigger enforces it).
- Escape output with `htmlspecialchars()` (the prototype's `escapeHtml()` does the same job).
- The kiosk should run without an officer login, and the officer pages should need one (not in the prototype).
- `TODAY` and the sample `PEOPLE` lookup in `app.js` are prototype stand-ins for `CURDATE()` and a SELECT.

## Sample data
8 people (Carlo Navarro has no student number; Rina Torres is a PUP student who isn't a member), 6 members (Member, Officer ×2, President, one inactive), 12 items (8 tools, 4 consumables; 2 low, 1 inactive), requests #1011 to #1018 in every status, and today's six sign-ins. Names and the 0900-000-xxxx numbers are made up.
