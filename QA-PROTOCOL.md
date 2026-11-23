# QA protocol (DBA HQ system): role-played visits

After building, check like real users, then fix.

## How to look
- Laptop: `bash "C:/Users/Lenovo/AppData/Local/Temp/claude/b1601c79e2a2c9b7/8dcefbb3-bc85-4918-b7e6-03cddba687e7/scratchpad/skill-lib/shoot.sh" <page.html> <out.png> 1280 800`
- Phone/tablet (true narrow width): `bash ".../skill-lib/phone.sh" <page.html path with forward slashes> <out.png> 390 844` (also 768 1024 for the kiosk on a tablet).
- Read the HTML/CSS/JS for behaviour screenshots can't show. One Chrome at a time, no dev servers, about 12 screenshots, delete them after.

## Visitors
1. **Mika, member, at the HQ door with one hand full.** Signs in for Project work with her student number, later signs out. Fast? Big enough? Clear confirmation?
2. **A visitor from another school** with no PUP student number, coming for a Workshop. Can they sign in without confusion?
3. **Paolo, officer, on his phone between classes.** Approves a pending request, rejects one, sees overdue tools, marks a tool returned. Is it safe (no accidental approve), and is the not-enough-stock case explained?
4. **The inventory officer at a laptop.** Adds a new consumable, restocks solder wire, spots low stock.
5. **Sir Espineli, the Database Administration professor.** Does each screen map clearly to the tables and rules in hygears.sql? Can the Reports page demonstrate the views and queries? Would the business rules be visible in the UI (e.g. visitors can't be members, consumables have no due date)?
6. **Sir Cadaoas / UI rules check** against `../../../Web-Development/ui-requirements-nov21.md`.
7. **Hans, groupmate rebuilding it in PHP.** Is it all plain HTML/CSS/JS he can explain? Field names match the SQL columns?
8. **Accessibility tester** (keyboard + screen reader).

## Output
`QA.md` in the folder: notes per visitor with severity, a de-duplicated fix list, then fix all blockers and majors (and cheap minors), re-check phone and laptop, and an **After fixes** section. Keep the direction's identity.
