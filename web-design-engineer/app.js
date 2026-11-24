/* =========================================================
   Hygears HQ System, "Scrutineering" direction.
   One plain script for all 8 pages. Each page's code runs only
   when <body data-page="..."> matches.
   All data below is SAMPLE data shaped like the tables in
   hygears.sql. In the PHP rebuild each array becomes a query.
   ========================================================= */

/* ---------- Sample data (same columns as hygears.sql) ---------- */
var TODAY = "2026-11-24";   // the sample day; "overdue" means due_date < TODAY
var ME = 2;                 // logged-in approver: Paolo Reyes (Officer)

var roles = [
  { role_id: 1, name: "Member", can_approve: false },
  { role_id: 2, name: "Officer", can_approve: true },
  { role_id: 3, name: "President", can_approve: true },
  { role_id: 4, name: "Adviser", can_approve: true }
];
var purposes = [
  { purpose_id: 1, name: "Meeting" }, { purpose_id: 2, name: "Project work" },
  { purpose_id: 3, name: "Workshop" }, { purpose_id: 4, name: "Tool use" },
  { purpose_id: 5, name: "Study" }, { purpose_id: 6, name: "Visit" }
];
var categories = [
  { category_id: 1, name: "Hand tools" }, { category_id: 2, name: "Power tools" },
  { category_id: 3, name: "Electronics" }, { category_id: 4, name: "Measuring instruments" },
  { category_id: 5, name: "Cutting consumables" }, { category_id: 6, name: "Soldering consumables" }
];
// person: visitors have student_id = null
var persons = [
  { person_id: 1, student_id: "2023-00101-MN-0", first_name: "Mika", last_name: "Santos", contact_number: "0917 555 0101", affiliation: "PUP Manila" },
  { person_id: 2, student_id: "2022-00214-MN-0", first_name: "Paolo", last_name: "Reyes", contact_number: "0917 555 0102", affiliation: "PUP Manila" },
  { person_id: 3, student_id: "2022-00187-MN-0", first_name: "Ana", last_name: "Lim", contact_number: "0917 555 0103", affiliation: "PUP Manila" },
  { person_id: 4, student_id: "2024-00342-MN-0", first_name: "Jun", last_name: "Bautista", contact_number: "0917 555 0104", affiliation: "PUP Manila" },
  { person_id: 5, student_id: "2023-00456-MN-0", first_name: "Carla", last_name: "Mendoza", contact_number: "0917 555 0105", affiliation: "PUP Manila" },
  { person_id: 6, student_id: "FAC-2019-0042", first_name: "Rafael", last_name: "Cruz", contact_number: "0917 555 0106", affiliation: "PUP Manila, faculty" },
  { person_id: 7, student_id: null, first_name: "Lea", last_name: "Navarro", contact_number: "0917 555 0107", affiliation: "TUP Manila" },
  { person_id: 8, student_id: null, first_name: "Diego", last_name: "Ramos", contact_number: "0917 555 0108", affiliation: "Mapua University" },
  { person_id: 9, student_id: "2024-00510-MN-0", first_name: "Bea", last_name: "Torres", contact_number: "0917 555 0109", affiliation: "PUP Manila" }
];
var members = [
  { person_id: 1, role_id: 1, email: "mika.santos@example.com", is_active: true, joined_on: "2025-08-15" },
  { person_id: 2, role_id: 2, email: "paolo.reyes@example.com", is_active: true, joined_on: "2024-08-20" },
  { person_id: 3, role_id: 3, email: "ana.lim@example.com", is_active: true, joined_on: "2024-08-20" },
  { person_id: 4, role_id: 1, email: "jun.bautista@example.com", is_active: true, joined_on: "2025-09-02" },
  { person_id: 5, role_id: 1, email: "carla.mendoza@example.com", is_active: true, joined_on: "2025-08-15" },
  { person_id: 6, role_id: 4, email: "rafael.cruz@example.com", is_active: true, joined_on: "2023-06-01" },
  { person_id: 9, role_id: 1, email: "bea.torres@example.com", is_active: false, joined_on: "2024-09-10" }
];
var attendance = [
  { attendance_id: 1, person_id: 4, purpose_id: 4, time_in: "2026-11-24T08:10", time_out: "2026-11-24T09:40", notes: "" },
  { attendance_id: 2, person_id: 5, purpose_id: 5, time_in: "2026-11-24T08:30", time_out: "2026-11-24T11:05", notes: "" },
  { attendance_id: 3, person_id: 2, purpose_id: 1, time_in: "2026-11-24T09:05", time_out: null, notes: "" },
  { attendance_id: 4, person_id: 8, purpose_id: 6, time_in: "2026-11-24T09:20", time_out: "2026-11-24T10:05", notes: "Shell Eco-marathon team visit" },
  { attendance_id: 5, person_id: 7, purpose_id: 3, time_in: "2026-11-24T10:00", time_out: null, notes: "" },
  { attendance_id: 6, person_id: 3, purpose_id: 1, time_in: "2026-11-24T10:15", time_out: null, notes: "" },
  { attendance_id: 7, person_id: 6, purpose_id: 3, time_in: "2026-11-24T10:30", time_out: null, notes: "Wiring workshop" },
  { attendance_id: 8, person_id: 1, purpose_id: 2, time_in: "2026-11-23T13:00", time_out: "2026-11-23T17:30", notes: "" },
  { attendance_id: 9, person_id: 4, purpose_id: 2, time_in: "2026-11-23T13:10", time_out: "2026-11-23T18:00", notes: "" },
  { attendance_id: 10, person_id: 2, purpose_id: 1, time_in: "2026-11-23T16:00", time_out: "2026-11-23T17:00", notes: "" },
  { attendance_id: 11, person_id: 3, purpose_id: 1, time_in: "2026-11-23T16:00", time_out: "2026-11-23T17:05", notes: "" }
];
// item + quantity_available as v_item_stock would return it
var items = [
  { item_id: 1, category_id: 2, name: "Cordless drill", item_type: "tool", quantity_total: 2, reorder_level: null, is_active: true, available: 1 },
  { item_id: 2, category_id: 4, name: "Digital multimeter", item_type: "tool", quantity_total: 3, reorder_level: null, is_active: true, available: 1 },
  { item_id: 3, category_id: 3, name: "Soldering iron 60 W", item_type: "tool", quantity_total: 4, reorder_level: null, is_active: true, available: 3 },
  { item_id: 4, category_id: 4, name: "Vernier caliper", item_type: "tool", quantity_total: 2, reorder_level: null, is_active: true, available: 2 },
  { item_id: 5, category_id: 1, name: "Socket wrench set", item_type: "tool", quantity_total: 2, reorder_level: null, is_active: true, available: 1 },
  { item_id: 6, category_id: 2, name: "Angle grinder", item_type: "tool", quantity_total: 1, reorder_level: null, is_active: true, available: 0 },
  { item_id: 7, category_id: 4, name: "Oscilloscope", item_type: "tool", quantity_total: 1, reorder_level: null, is_active: true, available: 1 },
  { item_id: 8, category_id: 6, name: "Solder wire 0.8 mm", item_type: "consumable", quantity_total: 10, reorder_level: 4, is_active: true, available: 3 },
  { item_id: 9, category_id: 6, name: "Flux paste", item_type: "consumable", quantity_total: 6, reorder_level: 2, is_active: true, available: 5 },
  { item_id: 10, category_id: 5, name: "Cutting disc 4 in", item_type: "consumable", quantity_total: 20, reorder_level: 5, is_active: true, available: 4 },
  { item_id: 11, category_id: 3, name: "Heat-shrink tubing pack", item_type: "consumable", quantity_total: 12, reorder_level: 3, is_active: true, available: 9 },
  { item_id: 12, category_id: 5, name: "Hacksaw blade", item_type: "consumable", quantity_total: 15, reorder_level: 5, is_active: true, available: 11 }
];
// item_request with its request_line rows nested as "lines"
var requests = [
  { request_id: 6, requested_by: 1, decided_by: 2, requested_at: "2026-11-18T09:00", decided_at: "2026-11-18T09:20", status: "completed", remarks: "",
    lines: [{ item_id: 8, quantity: 2, due_date: null, returned_at: null }] },
  { request_id: 7, requested_by: 4, decided_by: 3, requested_at: "2026-11-19T08:40", decided_at: "2026-11-19T10:00", status: "rejected", remarks: "Oscilloscope reserved for the Shell Eco-marathon wiring check.",
    lines: [{ item_id: 7, quantity: 1, due_date: "2026-11-21", returned_at: null }] },
  { request_id: 8, requested_by: 1, decided_by: 2, requested_at: "2026-11-23T09:10", decided_at: "2026-11-23T09:30", status: "approved", remarks: "",
    lines: [{ item_id: 1, quantity: 1, due_date: "2026-11-26", returned_at: null }] },
  { request_id: 9, requested_by: 4, decided_by: 3, requested_at: "2026-11-19T13:00", decided_at: "2026-11-19T13:15", status: "approved", remarks: "",
    lines: [{ item_id: 2, quantity: 1, due_date: "2026-11-21", returned_at: null }, { item_id: 6, quantity: 1, due_date: "2026-11-22", returned_at: null }] },
  { request_id: 10, requested_by: 3, decided_by: 2, requested_at: "2026-11-23T14:00", decided_at: "2026-11-23T14:05", status: "approved", remarks: "Chassis bolts",
    lines: [{ item_id: 2, quantity: 1, due_date: "2026-11-27", returned_at: null }, { item_id: 5, quantity: 1, due_date: "2026-11-27", returned_at: null }] },
  { request_id: 11, requested_by: 5, decided_by: 6, requested_at: "2026-11-22T10:00", decided_at: "2026-11-22T10:30", status: "approved", remarks: "",
    lines: [{ item_id: 3, quantity: 1, due_date: "2026-11-25", returned_at: null }] },
  { request_id: 12, requested_by: 2, decided_by: null, requested_at: "2026-11-24T08:50", decided_at: null, status: "pending", remarks: "Motor controller board",
    lines: [{ item_id: 3, quantity: 1, due_date: "2026-11-26", returned_at: null }, { item_id: 9, quantity: 1, due_date: null, returned_at: null }] },
  { request_id: 13, requested_by: 1, decided_by: null, requested_at: "2026-11-24T09:12", decided_at: null, status: "pending", remarks: "Battery pack wiring",
    lines: [{ item_id: 2, quantity: 1, due_date: "2026-11-28", returned_at: null }, { item_id: 8, quantity: 2, due_date: null, returned_at: null }] },
  { request_id: 14, requested_by: 5, decided_by: null, requested_at: "2026-11-24T09:40", decided_at: null, status: "pending", remarks: "",
    lines: [{ item_id: 6, quantity: 1, due_date: "2026-11-27", returned_at: null }] },
  { request_id: 15, requested_by: 4, decided_by: null, requested_at: "2026-11-24T10:05", decided_at: null, status: "pending", remarks: "Frame brackets",
    lines: [{ item_id: 2, quantity: 1, due_date: "2026-11-26", returned_at: null }, { item_id: 10, quantity: 2, due_date: null, returned_at: null }] }
];

/* ---------- Small helpers ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function byId(list, key, id) { return list.filter(function (r) { return r[key] === id; })[0]; }

// Escape text before putting it in innerHTML (same job as htmlspecialchars in PHP)
function esc(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-11-24T09:05" -> "9:05 AM"
function fmtTime(s) {
  if (!s) return "";
  var h = parseInt(s.substr(11, 2), 10), m = s.substr(14, 2);
  return (h % 12 || 12) + ":" + m + (h < 12 ? " AM" : " PM");
}
// "2026-11-24" -> "24 Nov"
function fmtDate(s) { return s ? parseInt(s.substr(8, 2), 10) + " " + MONTHS[parseInt(s.substr(5, 2), 10) - 1] : ""; }
function fmtDateTime(s) { return fmtDate(s) + ", " + fmtTime(s); }
// Current clock time on the sample day.
// shortcut: uses TODAY's date with the real clock; PHP uses NOW() instead.
function nowStamp() {
  var d = new Date();
  return TODAY + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function personName(id) { var p = byId(persons, "person_id", id); return p ? p.first_name + " " + p.last_name : "?"; }
function memberOf(id) { return byId(members, "person_id", id); }
function roleOf(id) { var m = memberOf(id); return m ? byId(roles, "role_id", m.role_id) : null; }
function itemOf(id) { return byId(items, "item_id", id); }
function purposeName(id) { return byId(purposes, "purpose_id", id).name; }
// "Member, Officer" / "Visitor, TUP Manila" / "Not a member"
function personTag(id) {
  var p = byId(persons, "person_id", id), r = roleOf(id);
  if (r) return r.name;
  return p.student_id ? "Not a member" : "Visitor, " + p.affiliation;
}
function isInside(personId) {
  return attendance.filter(function (a) { return a.person_id === personId && !a.time_out; })[0];
}

/* ---------- Stock and loans (what the views return) ---------- */
// v_open_loans: tool lines of approved requests not yet returned
function openLoans() {
  var out = [];
  requests.forEach(function (r) {
    if (r.status !== "approved") return;
    r.lines.forEach(function (l) {
      var it = itemOf(l.item_id);
      if (it.item_type === "tool" && !l.returned_at) out.push({ req: r, line: l, item: it, overdue: l.due_date < TODAY });
    });
  });
  return out.sort(function (a, b) { return a.line.due_date < b.line.due_date ? -1 : 1; });
}
// v_low_stock
function lowStock() {
  return items.filter(function (i) { return i.is_active && i.reorder_level != null && i.available <= i.reorder_level; });
}
function hasOverdue(personId) {
  return openLoans().some(function (l) { return l.overdue && l.req.requested_by === personId; });
}

/* ---------- The inspection checklist ---------- */
// state: pass | fail | warn | todo. Each check names the DB rule behind it.
var WORDS = { pass: "PASS", fail: "FAIL", warn: "NOTE", todo: "WAIT" };
var BOXES = { pass: "&#10003;", fail: "&#10005;", warn: "!", todo: "" };
var SR = { pass: "Passed: ", fail: "Failed: ", warn: "Note: ", todo: "Not checked yet: " };
function check(state, text, code) { return { state: state, text: text, code: code }; }
function checksHTML(list) {
  return list.map(function (c) {
    return '<li class="check is-' + c.state + '"><span class="box" aria-hidden="true">' + BOXES[c.state] + "</span>" +
      '<span><span class="sr-only">' + SR[c.state] + "</span>" + c.text + (c.code ? " <code>" + esc(c.code) + "</code>" : "") + "</span>" +
      '<span class="word" aria-hidden="true">' + WORDS[c.state] + "</span></li>";
  }).join("");
}
function allPass(list) { return list.every(function (c) { return c.state === "pass" || c.state === "warn"; }); }

/* ---------- Toast with optional Undo ---------- */
var toastTimer;
function toast(message, undo) {
  var region = $("#toast-region");
  region.innerHTML = "";
  var box = document.createElement("div");
  box.className = "toast";
  box.innerHTML = "<p>" + esc(message) + "</p>";
  if (undo) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-sm"; b.textContent = "Undo";
    b.addEventListener("click", function () { undo(); region.innerHTML = ""; });
    box.appendChild(b);
  }
  region.appendChild(box);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { region.innerHTML = ""; }, undo ? 8000 : 5000);
}

/* ---------- Form errors ---------- */
// Shows the <p class="error"> that follows the field and marks the input invalid
function setError(input, message) {
  var err = input.closest(".field") ? $(".error", input.closest(".field")) : null;
  input.setAttribute("aria-invalid", "true");
  if (err) {
    if (message) err.textContent = message;
    err.hidden = false;
    if (!err.id) err.id = (input.id || "f") + "-err";
    input.setAttribute("aria-describedby", ((input.getAttribute("aria-describedby") || "").replace(err.id, "") + " " + err.id).trim());
  }
}
function clearErrors(form) {
  $all(".error", form).forEach(function (e) { e.hidden = true; });
  $all("[aria-invalid]", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
}
function focusFirstError(form) { var f = $("[aria-invalid='true']", form); if (f) f.focus(); }

/* ---------- Two-tap buttons for Approve / Reject / Mark returned ---------- */
// First tap arms the button for 4 seconds; only the second tap runs the action.
function twoTap(btn, confirmLabel, action) {
  btn.addEventListener("click", function () {
    if (btn.getAttribute("aria-disabled") === "true") return;
    if (btn.classList.contains("armed")) { action(); return; }
    var label = btn.textContent;
    btn.classList.add("armed");
    btn.textContent = confirmLabel;
    announce(confirmLabel + ".");
    setTimeout(function () {
      if (!document.body.contains(btn)) return;
      btn.classList.remove("armed");
      btn.textContent = label;
    }, 4000);
  });
}

// Screen-reader-only message (e.g. "Tap again to approve")
function announce(text) {
  var live = $("#sr-live");
  if (!live) { live = document.createElement("p"); live.id = "sr-live"; live.className = "sr-only"; live.setAttribute("aria-live", "assertive"); document.body.appendChild(live); }
  live.textContent = text;
}

/* ---------- Mobile menu ---------- */
function setupMenu() {
  var btn = $(".menu-btn");
  btn.addEventListener("click", function () {
    var open = $("#sidebar").classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  });
}

/* ---------- Table rendering ---------- */
// cols: [{ label, cls, html(row) }]. The first column is the "lead" (name first on phones).
function renderRows(table, rows, cols, emptyText) {
  var tbody = $("tbody", table);
  if (!rows.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="' + cols.length + '">' + esc(emptyText || "Nothing here.") + "</td></tr>";
    return;
  }
  tbody.innerHTML = rows.map(function (r) {
    return "<tr" + (r._alert ? ' class="is-alert"' : "") + ">" + cols.map(function (c, i) {
      var cls = (i === 0 ? "lead " : "") + (c.cls || "");
      return '<td data-label="' + esc(c.label) + '"' + (cls.trim() ? ' class="' + cls.trim() + '"' : "") + ">" + c.html(r) + "</td>";
    }).join("") + "</tr>";
  }).join("");
}
function stamp(kind, icon, word) {
  return '<span class="stamp ' + (kind || "") + '"><span aria-hidden="true">' + icon + "</span>" + word + "</span>";
}

/* =========================================================
   00 KIOSK (index.html)
   ========================================================= */
function initKiosk() {
  var form = $("#signin"), sid = $("#k-sid"), letters = false, resetTimer;

  // Digits only -> "2023-00101-MN-0". Letter mode keeps what was typed.
  function formatSid(raw) {
    if (letters) return raw.trim().toUpperCase();
    var d = raw.replace(/\D/g, "").slice(0, 10);
    var parts = [d.slice(0, 4), d.slice(4, 9)];
    if (d.length > 9) parts.push("MN", d.slice(9));
    return parts.filter(Boolean).join("-");
  }
  function isComplete(raw) { return letters ? raw.trim().length >= 5 : raw.replace(/\D/g, "").length === 10; }
  function findBySid(s) { return persons.filter(function (p) { return p.student_id === s; })[0]; }
  function who() { return $("input[name=who]:checked", form).value; }
  function purpose() { var r = $("input[name=purpose_id]:checked", form); return r ? parseInt(r.value, 10) : null; }

  function kioskChecks() {
    var list = [];
    if (who() === "student") {
      var raw = sid.value, p = isComplete(raw) ? findBySid(formatSid(raw)) : null;
      if (!raw.trim()) list.push(check("todo", "Student number is on file", "person.student_id"));
      else if (!isComplete(raw)) list.push(check("todo", "Keep typing: student numbers have 10 digits", "person.student_id"));
      else if (!p) list.push(check("fail", "No one has " + esc(formatSid(raw)) + " yet. Check the number, ask an officer to add you, or tap Visitor.", "person.student_id"));
      else list.push(check("pass", "Found <strong>" + esc(p.first_name + " " + p.last_name) + "</strong>, " + esc(personTag(p.person_id)), "person.student_id"));
      var open = p && isInside(p.person_id);
      if (!p) list.push(check("todo", "Not already signed in", "time_out IS NULL"));
      else if (open) list.push(check("fail", "Already inside since " + fmtTime(open.time_in) + '. <a href="#inside">Sign out first</a>.', "time_out IS NULL"));
      else list.push(check("pass", "Not already signed in", "time_out IS NULL"));
    } else {
      var filled = $("#k-first").value.trim() && $("#k-last").value.trim() && $("#k-contact").value.replace(/\D/g, "").length >= 7 && $("#k-aff").value.trim();
      list.push(check(filled ? "pass" : "todo", "Name, contact number and school filled", "NOT NULL"));
      var dupe = persons.filter(function (x) {
        return !x.student_id && x.contact_number.replace(/\D/g, "") === $("#k-contact").value.replace(/\D/g, "") && isInside(x.person_id);
      })[0];
      list.push(dupe ? check("fail", "This contact number is already inside (" + esc(dupe.first_name + " " + dupe.last_name) + '). <a href="#inside">Sign out first</a>.', "time_out IS NULL")
        : check(filled ? "pass" : "todo", "Not already signed in", "time_out IS NULL"));
      list.push(check("warn", "Saved with no student number, so a visitor can't be made a member", "trg_member_requires_student_id_ins"));
    }
    list.push(check(purpose() ? "pass" : "todo", "Purpose chosen", "purpose_id"));
    return list;
  }
  function refresh() {
    $("#k-checks").innerHTML = checksHTML(kioskChecks());
    var raw = sid.value;
    var p = isComplete(raw) ? findBySid(formatSid(raw)) : null;
    $("#k-sid-read").innerHTML = raw.trim() ? "Reads as " + esc(formatSid(raw)) + (p ? " &middot; <strong>" + esc(p.first_name + " " + p.last_name) + "</strong>" : "") : "";
  }

  // In the HQ now
  function renderInside() {
    var q = $("#k-find").value.trim().toLowerCase();
    var open = attendance.filter(function (a) { return !a.time_out; });
    var shown = open.filter(function (a) { return personName(a.person_id).toLowerCase().indexOf(q) !== -1; });
    $("#inside-list").innerHTML = shown.map(function (a) {
      var name = personName(a.person_id);
      return '<li><span class="who-in"><strong>' + esc(name) + "</strong><span>" + esc(personTag(a.person_id)) + " &middot; " +
        esc(purposeName(a.purpose_id)) + " &middot; since " + fmtTime(a.time_in) + "</span></span>" +
        '<button class="btn" type="button" data-out="' + a.attendance_id + '" aria-label="Sign out ' + esc(name) + '">Sign out</button></li>';
    }).join("");
    $("#inside-empty").hidden = shown.length > 0;
    $("#inside-empty").textContent = open.length ? "Nobody by that name is inside." : "Nobody is signed in.";
    $("#inside-count").textContent = "(" + open.length + ")";
    $("#jump-count").textContent = "(" + open.length + " inside)";
  }
  $("#inside-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-out]");
    if (!b) return;
    var a = byId(attendance, "attendance_id", parseInt(b.getAttribute("data-out"), 10));
    a.time_out = nowStamp();
    renderInside(); refresh();
    toast(personName(a.person_id) + " signed out at " + fmtTime(a.time_out) + ".", function () { a.time_out = null; renderInside(); refresh(); });
  });
  $("#k-find").addEventListener("input", renderInside);

  // Switch between student and visitor fields
  form.addEventListener("change", function (e) {
    if (e.target.name === "who") {
      $("#student-fields").hidden = who() !== "student";
      $("#visitor-fields").hidden = who() !== "visitor";
      clearErrors(form);
    }
    refresh();
  });
  form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid")) { clearErrors(form); } refresh(); });
  $("#k-kbd").addEventListener("click", function () {
    letters = !letters;
    sid.setAttribute("inputmode", letters ? "text" : "numeric");
    this.textContent = letters ? "Digits only? Use the number pad" : "Number has letters, like FAC-? Use the letter keyboard";
    sid.focus(); refresh();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var list = kioskChecks(), person;
    if (who() === "student") {
      var p = isComplete(sid.value) ? findBySid(formatSid(sid.value)) : null;
      if (!sid.value.trim()) setError(sid, "Enter your student number.");
      else if (!isComplete(sid.value)) setError(sid, "Student numbers have 10 digits. You typed " + sid.value.replace(/\D/g, "").length + ".");
      else if (!p) setError(sid, "No one has " + formatSid(sid.value) + " yet. Ask an officer to add you, or tap Visitor.");
      else if (isInside(p.person_id)) setError(sid, p.first_name + " is already inside since " + fmtTime(isInside(p.person_id).time_in) + ". Sign out first.");
      person = p;
    } else {
      ["#k-first", "#k-last", "#k-aff"].forEach(function (s) { if (!$(s).value.trim()) setError($(s)); });
      if ($("#k-contact").value.replace(/\D/g, "").length < 7) setError($("#k-contact"));
      else if (list[1].state === "fail") setError($("#k-contact"), "This contact number is already signed in. Sign out first.");
    }
    if (!purpose()) { $("#k-purpose-err").hidden = false; }
    var bad = $("[aria-invalid='true']", form);
    if (bad || !purpose()) { (bad || $("input[name=purpose_id]", form)).focus(); return; }

    if (who() === "visitor") {
      person = { person_id: persons.length + 1, student_id: null, first_name: $("#k-first").value.trim(), last_name: $("#k-last").value.trim(),
        contact_number: $("#k-contact").value.trim(), affiliation: $("#k-aff").value.trim() };
      persons.push(person);
    }
    var row = { attendance_id: attendance.length + 1, person_id: person.person_id, purpose_id: purpose(), time_in: nowStamp(), time_out: null, notes: "" };
    attendance.push(row);
    renderInside();

    // Confirmation panel, then clear for the next person
    form.hidden = true;
    $("#k-done-time").textContent = fmtTime(row.time_in);
    $("#k-done-name").textContent = person.first_name + " " + person.last_name;
    $("#k-done-detail").textContent = purposeName(row.purpose_id) + ". When you leave, tap Sign out next to your name.";
    $("#k-done").hidden = false;
    $("#k-done").focus();
    var left = 8;
    $("#k-countdown").textContent = left;
    resetTimer = setInterval(function () { left--; $("#k-countdown").textContent = left; if (left <= 0) nextPerson(); }, 1000);
  });
  function nextPerson() {
    clearInterval(resetTimer);
    form.reset(); letters = false; sid.setAttribute("inputmode", "numeric");
    $("#student-fields").hidden = false; $("#visitor-fields").hidden = true;
    $("#k-done").hidden = true; form.hidden = false; clearErrors(form); refresh();
    sid.focus();
  }
  $("#k-next").addEventListener("click", nextPerson);

  renderInside(); refresh();
}

/* =========================================================
   01 DASHBOARD
   ========================================================= */
function initDashboard() {
  var inside = attendance.filter(function (a) { return !a.time_out; });
  var pending = requests.filter(function (r) { return r.status === "pending"; });
  var loans = openLoans(), overdue = loans.filter(function (l) { return l.overdue; }), low = lowStock();
  var today = attendance.filter(function (a) { return a.time_in.substr(0, 10) === TODAY; });
  var figs = [
    ["In the HQ now", inside.length, "time_out IS NULL", "attendance.html?inside=1", false],
    ["Pending requests", pending.length, "status = 'pending'", "requests.html#pending", pending.length > 0],
    ["Overdue tools", overdue.length, "is_overdue = 1", "requests.html#loans", overdue.length > 0],
    ["Low stock", low.length, "v_low_stock", "items.html?low=1", low.length > 0],
    ["Today's sign-ins", today.length, "DATE(time_in) = CURDATE()", "attendance.html?date=" + TODAY, false]
  ];
  $("#figures").innerHTML = figs.map(function (f) {
    return '<div class="fig' + (f[4] ? " is-alert" : "") + '"><dt><a href="' + f[3] + '">' + f[0] + "</a></dt><dd>" + f[1] +
      (f[4] ? '<span class="sr-only"> (needs action)</span>' : "") + "</dd><code>" + f[2] + "</code></div>";
  }).join("");

  // Needs action: failed checks first, in order of urgency
  var queue = [];
  overdue.forEach(function (l) {
    queue.push(check("fail", "<strong>Overdue:</strong> " + esc(l.item.name) + " &times;" + l.line.quantity + " with " + esc(personName(l.req.requested_by)) +
      ", due " + fmtDate(l.line.due_date) + '. <a href="requests.html#loans">Open loans</a>', "is_overdue"));
  });
  pending.forEach(function (r) {
    var short = r.lines.filter(function (l) { return l.quantity > itemOf(l.item_id).available; });
    var no = "No. " + String(r.request_id).padStart(4, "0");
    if (short.length && r.requested_by !== ME) queue.push(check("fail", "<strong>" + no + " can't be approved:</strong> " + esc(personName(r.requested_by)) + " asks for " +
      short.map(function (l) { return esc(itemOf(l.item_id).name) + " &times;" + l.quantity + " (" + itemOf(l.item_id).available + " available)"; }).join(", ") +
      '. <a href="requests.html#req-' + r.request_id + '">Reject with a reason</a>', "v_item_stock"));
    else if (r.requested_by === ME) queue.push(check("warn", "<strong>" + no + " is your own request:</strong> another officer, the President or the Adviser decides it.", "chk_request_not_self"));
    else queue.push(check("warn", "<strong>" + no + " waiting:</strong> " + esc(personName(r.requested_by)) + ", " + r.lines.length + " item" + (r.lines.length > 1 ? "s" : "") +
      '. <a href="requests.html#req-' + r.request_id + '">Decide</a>', "status = 'pending'"));
  });
  low.forEach(function (i) {
    queue.push(check("fail", "<strong>Low stock:</strong> " + esc(i.name) + ", " + i.available + " left (reorder at " + i.reorder_level + ')' +
      '. <a href="items.html#restock-panel">Restock</a>', "v_low_stock"));
  });
  $("#queue").innerHTML = checksHTML(queue);
  $("#queue-pass").textContent = "Passed: " + (items.length - low.length) + " items above reorder level, " + (loans.length - overdue.length) + " tools out and on time.";

  renderRows($("#dash-inside"), inside, [
    { label: "Name", html: function (a) { return esc(personName(a.person_id)) + "<small>" + esc(personTag(a.person_id)) + "</small>"; } },
    { label: "Purpose", html: function (a) { return esc(purposeName(a.purpose_id)); } },
    { label: "time_in", cls: "num", html: function (a) { return fmtTime(a.time_in); } }
  ], "Nobody is inside.");
}

/* =========================================================
   02 ATTENDANCE
   ========================================================= */
function initAttendance() {
  var form = $("#att-filters");
  var params = new URLSearchParams(location.search);
  if (params.get("date")) form.date.value = params.get("date");
  if (params.get("inside")) form.inside.checked = true;

  function apply() {
    var rows = attendance.filter(function (a) {
      var visitor = !persons.filter(function (p) { return p.person_id === a.person_id; })[0].student_id;
      var isMember = !!memberOf(a.person_id);
      return (!form.date.value || a.time_in.substr(0, 10) === form.date.value) &&
        (!form.purpose.value || a.purpose_id === parseInt(form.purpose.value, 10)) &&
        (!form.who.value || (form.who.value === "member" ? isMember : visitor)) &&
        (!form.inside.checked || !a.time_out);
    }).sort(function (a, b) { return a.time_in < b.time_in ? 1 : -1; });
    renderRows($("#att-table"), rows, [
      { label: "Name", html: function (a) { return esc(personName(a.person_id)) + "<small>" + esc(personTag(a.person_id)) + "</small>"; } },
      { label: "Student ID", html: function (a) { var s = byId(persons, "person_id", a.person_id).student_id; return s ? "<code>" + esc(s) + "</code>" : '<span class="muted">NULL (visitor)</span>'; } },
      { label: "Purpose", html: function (a) { return esc(purposeName(a.purpose_id)); } },
      { label: "In", html: function (a) { return fmtDateTime(a.time_in); } },
      { label: "Out", html: function (a) { return a.time_out ? fmtTime(a.time_out) : stamp("stamp-solid", "&#9679;", "Still inside"); } },
      { label: "Notes", html: function (a) { return a.notes ? esc(a.notes) : '<span class="muted">None</span>'; } }
    ], "No sign-ins match these filters. Clear a filter to see more.");
    $("#att-count").textContent = "Showing " + rows.length + " of " + attendance.length + " sign-ins";
  }
  form.addEventListener("change", apply);
  $("#export").addEventListener("click", function () { toast("Export is a stub in the prototype. In PHP it sends the filtered rows as text/csv."); });
  apply();
}

/* =========================================================
   03 PEOPLE
   ========================================================= */
function initPeople() {
  var filters = $("#ppl-filters"), form = $("#person-form");
  $("#pf-role").innerHTML = roles.map(function (r) { return '<option value="' + r.role_id + '">' + esc(r.name) + "</option>"; }).join("");

  function render() {
    var q = filters.q.value.trim().toLowerCase(), kind = filters.kind.value;
    var rows = persons.filter(function (p) {
      var m = memberOf(p.person_id);
      var text = (p.first_name + " " + p.last_name + " " + (p.student_id || "")).toLowerCase();
      return text.indexOf(q) !== -1 && (!kind ||
        (kind === "active" && m && m.is_active) || (kind === "inactive" && m && !m.is_active) || (kind === "visitor" && !p.student_id));
    });
    rows.forEach(function (p) { var m = memberOf(p.person_id); p._alert = false; p._m = m; });
    renderRows($("#ppl-table"), rows, [
      { label: "Name", html: function (p) { return esc(p.first_name + " " + p.last_name) + (p._m && p._m.email ? "<small>" + esc(p._m.email) + "</small>" : ""); } },
      { label: "Student ID", html: function (p) { return p.student_id ? "<code>" + esc(p.student_id) + "</code>" : '<span class="muted">NULL (visitor)</span>'; } },
      { label: "Contact", html: function (p) { return esc(p.contact_number); } },
      { label: "Affiliation", html: function (p) { return esc(p.affiliation || ""); } },
      { label: "Role", html: function (p) { return p._m ? esc(byId(roles, "role_id", p._m.role_id).name) : '<span class="muted">' + (p.student_id ? "Not a member" : "Visitor, can't be a member") + "</span>"; } },
      { label: "Status", html: function (p) {
        if (!p._m) return '<span class="muted">n/a</span>';
        return p._m.is_active ? stamp("", "&#10003;", "Active") : stamp("stamp-quiet", "&#8211;", "Inactive");
      } },
      { label: "Actions", cls: "actions", html: function (p) {
        if (p._m) return '<button class="btn btn-sm" type="button" data-toggle="' + p.person_id + '">' + (p._m.is_active ? "Deactivate" : "Activate") + '<span class="sr-only"> ' + esc(p.first_name + " " + p.last_name) + "</span></button>";
        if (p.student_id) return '<button class="btn btn-sm" type="button" data-make="' + p.person_id + '">Make member</button>';
        return "";
      } }
    ], "No people match. Clear the search, or add the person below.");
    $("#ppl-count").textContent = "Showing " + rows.length + " of " + persons.length + " people";
  }
  filters.addEventListener("input", render);
  filters.addEventListener("submit", function (e) { e.preventDefault(); });

  $("#ppl-table").addEventListener("click", function (e) {
    var t = e.target.closest("[data-toggle]");
    if (t) {
      var m = memberOf(parseInt(t.getAttribute("data-toggle"), 10));
      m.is_active = !m.is_active; render();
      toast(personName(m.person_id) + " is now " + (m.is_active ? "active" : "inactive") + ".", function () { m.is_active = !m.is_active; render(); });
    }
  });

  function personChecks() {
    var sid = form.student_id.value.trim().toUpperCase(), wantsMember = form.is_member.checked;
    var taken = sid && persons.some(function (p) { return p.student_id === sid; });
    var filled = form.first_name.value.trim() && form.last_name.value.trim() && form.contact_number.value.trim();
    var list = [check(filled ? "pass" : "todo", "First name, last name and contact number filled", "NOT NULL")];
    if (!sid) list.push(check(wantsMember ? "todo" : "warn", "No student ID: saved as a visitor", "student_id NULL"));
    else list.push(check(taken ? "fail" : "pass", taken ? "Student ID " + esc(sid) + " already belongs to someone" : "Student ID is not used yet", "uq_person_student_id"));
    if (wantsMember) list.push(check(sid ? "pass" : "fail", sid ? "Member has a student ID" : "A member needs a student ID. Visitors can't be members.", "trg_member_requires_student_id_ins"));
    return list;
  }
  function refresh() { $("#pf-checks").innerHTML = checksHTML(personChecks()); $("#pf-member-fields").hidden = !form.is_member.checked; }
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("reset", function () { setTimeout(function () { clearErrors(form); refresh(); }, 0); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    ["first_name", "last_name", "contact_number"].forEach(function (n) { if (!form[n].value.trim()) setError(form[n]); });
    var sid = form.student_id.value.trim().toUpperCase();
    if (sid && persons.some(function (p) { return p.student_id === sid; })) setError(form.student_id, "Student ID " + sid + " is already used (uq_person_student_id).");
    else if (form.is_member.checked && !sid) setError(form.student_id, "A member needs a student ID (trg_member_requires_student_id_ins).");
    if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }
    var p = { person_id: persons.length + 1, student_id: sid || null, first_name: form.first_name.value.trim(), last_name: form.last_name.value.trim(),
      contact_number: form.contact_number.value.trim(), affiliation: form.affiliation.value.trim() };
    persons.push(p);
    if (form.is_member.checked) members.push({ person_id: p.person_id, role_id: parseInt(form.role_id.value, 10), email: form.email.value.trim(), is_active: true, joined_on: form.joined_on.value });
    var asMember = form.is_member.checked;
    form.reset(); render();
    toast("Saved " + p.first_name + " " + p.last_name + (asMember ? " as a member." : "."));
  });

  // "Make member" on a non-member with a student ID: open the member options for them
  $("#ppl-table").addEventListener("click", function (e) {
    var b = e.target.closest("[data-make]");
    if (!b) return;
    var p = byId(persons, "person_id", parseInt(b.getAttribute("data-make"), 10));
    members.push({ person_id: p.person_id, role_id: 1, email: "", is_active: true, joined_on: TODAY });
    render();
    toast(p.first_name + " " + p.last_name + " is now a member (role: Member).", function () { members.pop(); render(); });
  });

  render(); refresh();
}

/* =========================================================
   04 ITEMS
   ========================================================= */
function initItems() {
  var filters = $("#item-filters"), form = $("#item-form"), rs = $("#restock-form");
  if (new URLSearchParams(location.search).get("low")) filters.low.checked = true;

  function render() {
    var q = filters.q.value.trim().toLowerCase(), low = lowStock();
    var rows = items.filter(function (i) {
      return i.name.toLowerCase().indexOf(q) !== -1 && (!filters.cat.value || i.category_id === parseInt(filters.cat.value, 10)) &&
        (!filters.type.value || i.item_type === filters.type.value) && (!filters.low.checked || low.indexOf(i) !== -1);
    });
    rows.forEach(function (i) { i._alert = low.indexOf(i) !== -1; });
    renderRows($("#items-table"), rows, [
      { label: "Item", html: function (i) { return esc(i.name); } },
      { label: "Category", html: function (i) { return esc(byId(categories, "category_id", i.category_id).name); } },
      { label: "Type", html: function (i) { return i.item_type; } },
      { label: "Total", cls: "num", html: function (i) { return i.quantity_total; } },
      { label: "Available", cls: "num", html: function (i) { return "<strong>" + i.available + "</strong>"; } },
      { label: "Reorder", cls: "num", html: function (i) { return i.reorder_level == null ? '<span class="muted">None</span>' : i.reorder_level; } },
      { label: "Status", html: function (i) {
        if (!i.is_active) return stamp("stamp-quiet", "&#8211;", "Inactive");
        if (i._alert) return stamp("stamp-alert", "&#9888;", "Low stock");
        return i.available === 0 ? stamp("stamp-quiet", "&#9675;", "All out") : stamp("", "&#10003;", "OK");
      } },
      { label: "Actions", cls: "actions", html: function (i) {
        return '<div class="btn-row"><button class="btn btn-sm" type="button" data-edit="' + i.item_id + '">Edit<span class="sr-only"> ' + esc(i.name) + "</span></button>" +
          (i.item_type === "consumable" ? '<button class="btn btn-sm" type="button" data-restock="' + i.item_id + '">Restock<span class="sr-only"> ' + esc(i.name) + "</span></button>" : "") + "</div>";
      } }
    ], "No items match these filters. Clear a filter to see more.");
    $("#items-count").textContent = "Showing " + rows.length + " of " + items.length + " items";
    $("#low-notice").innerHTML = low.length ? '<div class="notice notice-alert" role="status"><strong><span aria-hidden="true">&#9888;</span> ' + low.length +
      " consumable" + (low.length > 1 ? "s are" : " is") + " at or below the reorder level</strong>" +
      low.map(function (i) { return esc(i.name) + ": " + i.available + " left, reorder at " + i.reorder_level; }).join(" &middot; ") + "</div>" : "";
    var keep = rs.item_id.value;
    rs.item_id.innerHTML = '<option value="">Choose a consumable</option>' + items.filter(function (i) { return i.item_type === "consumable" && i.is_active; })
      .map(function (i) { return '<option value="' + i.item_id + '">' + esc(i.name) + " (" + i.available + " available)</option>"; }).join("");
    rs.item_id.value = keep;
  }
  filters.addEventListener("input", render);
  filters.addEventListener("change", render);
  filters.addEventListener("submit", function (e) { e.preventDefault(); });

  // Add / edit item
  function editing() { return form.item_id.value ? itemOf(parseInt(form.item_id.value, 10)) : null; }
  function itemChecks() {
    var name = form.name.value.trim(), it = editing(), total = form.quantity_total.value;
    var clash = name && items.some(function (i) { return i.name.toLowerCase() === name.toLowerCase() && i !== it; });
    var out = it ? it.quantity_total - it.available : 0;
    var list = [
      check(!name ? "todo" : clash ? "fail" : "pass", clash ? "Another item is already called " + esc(name) : "Name is filled and not used by another item", "uq_item_name"),
      check(form.category_id.value ? "pass" : "todo", "Category chosen", "category_id")
    ];
    if (total === "" || parseInt(total, 10) < 0) list.push(check("todo", "Total is 0 or more", "INT UNSIGNED"));
    else if (it && it.item_type === "tool" && parseInt(total, 10) < out) list.push(check("fail", out + " units are out on loan, so the total can't go below " + out, "v_item_stock"));
    else list.push(check("pass", "Total is 0 or more", "INT UNSIGNED"));
    if ($("input[name=item_type]:checked", form).value === "consumable")
      list.push(check(form.reorder_level.value ? "pass" : "warn", form.reorder_level.value ? "Reorder level set, so low stock is flagged" : "No reorder level: it will never show as low stock", "v_low_stock"));
    return list;
  }
  function refresh() { $("#if-checks").innerHTML = checksHTML(itemChecks()); }
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("reset", function () {
    setTimeout(function () { form.item_id.value = ""; $("#if-h").textContent = "Add item"; $("#if-sql").textContent = "INSERT INTO item"; $("#if-submit").textContent = "Save item"; clearErrors(form); refresh(); }, 0);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var list = itemChecks();
    if (list[0].state !== "pass") setError(form.name, list[0].state === "fail" ? "Another item already has this name (uq_item_name)." : "Enter a name.");
    if (!form.category_id.value) setError(form.category_id);
    if (list[2].state !== "pass") setError(form.quantity_total, list[2].state === "fail" ? "Some units are out on loan; the total can't go below them." : "Enter 0 or more.");
    if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }
    var data = { name: form.name.value.trim(), category_id: parseInt(form.category_id.value, 10), item_type: $("input[name=item_type]:checked", form).value,
      quantity_total: parseInt(form.quantity_total.value, 10), reorder_level: form.reorder_level.value === "" ? null : parseInt(form.reorder_level.value, 10), is_active: form.is_active.checked };
    var it = editing();
    if (it) {
      it.available += data.quantity_total - it.quantity_total; // v_item_stock recalculates from the new total
      Object.keys(data).forEach(function (k) { it[k] = data[k]; });
      toast("Updated " + it.name + ".");
    } else {
      data.item_id = items.length + 1; data.available = data.quantity_total;
      items.push(data);
      toast("Added " + data.name + " (" + data.item_type + ").");
    }
    form.reset(); render();
  });

  $("#items-table").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]"), re = e.target.closest("[data-restock]");
    if (ed) {
      var it = itemOf(parseInt(ed.getAttribute("data-edit"), 10));
      form.item_id.value = it.item_id; form.name.value = it.name; form.category_id.value = it.category_id;
      $("input[name=item_type][value=" + it.item_type + "]", form).checked = true;
      form.quantity_total.value = it.quantity_total; form.reorder_level.value = it.reorder_level == null ? "" : it.reorder_level; form.is_active.checked = it.is_active;
      $("#if-h").textContent = "Edit " + it.name; $("#if-sql").textContent = "UPDATE item"; $("#if-submit").textContent = "Save changes";
      refresh(); $("#item-form-panel").focus(); form.name.focus();
    }
    if (re) { rs.item_id.value = re.getAttribute("data-restock"); rsRefresh(); rs.quantity.focus(); }
  });

  // Restock (consumables only)
  function rsChecks() {
    var q = parseInt(rs.quantity.value, 10);
    return [
      check(rs.item_id.value ? "pass" : "todo", "Consumable chosen", "item_id"),
      check(rs.quantity.value === "" ? "todo" : q > 0 ? "pass" : "fail", "Quantity is more than 0", "chk_restock_qty"),
      check(!rs.restocked_on.value ? "todo" : rs.restocked_on.value <= TODAY ? "pass" : "fail", "Date is not in the future", "restocked_on")
    ];
  }
  function rsRefresh() { $("#rs-checks").innerHTML = checksHTML(rsChecks()); }
  rs.addEventListener("input", rsRefresh);
  rs.addEventListener("change", rsRefresh);
  rs.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(rs);
    var c = rsChecks();
    if (c[0].state !== "pass") setError(rs.item_id);
    if (c[1].state !== "pass") setError(rs.quantity);
    if (c[2].state !== "pass") setError(rs.restocked_on);
    if ($("[aria-invalid='true']", rs)) { focusFirstError(rs); return; }
    var it = itemOf(parseInt(rs.item_id.value, 10)), before = it.available, wasLow = lowStock().indexOf(it) !== -1;
    it.available += parseInt(rs.quantity.value, 10);
    var stillLow = lowStock().indexOf(it) !== -1;
    rs.reset(); render(); rsRefresh();
    toast(it.name + ": " + before + " to " + it.available + " available." + (wasLow && !stillLow ? " No longer low." : stillLow ? " Still at or below reorder level." : ""));
  });

  render(); refresh(); rsRefresh();
}

/* =========================================================
   05 REQUESTS
   ========================================================= */
function reqNo(r) { return "No. " + String(r.request_id).padStart(4, "0"); }
function lineText(l) { return itemOf(l.item_id).name + " ×" + l.quantity; }

// The inspection for one pending request, as the approver (ME) sees it
function requestChecks(r) {
  var me = roleOf(ME), list = [];
  list.push(r.requested_by === ME ? check("fail", "This is your own request. Another officer, the President or the Adviser has to decide it.", "chk_request_not_self")
    : check("pass", "You are not the requester", "chk_request_not_self"));
  list.push(check(me && me.can_approve && memberOf(ME).is_active ? "pass" : "fail", "Your role (" + esc(me.name) + ") can approve", "trg_request_approver_upd"));
  r.lines.forEach(function (l) {
    var it = itemOf(l.item_id), ok = l.quantity <= it.available;
    list.push(check(ok ? "pass" : "fail", esc(it.name) + ": asks " + l.quantity + ", " + it.available + " available" + (ok ? "" : ". Not enough stock: reject with a reason, or wait for a return."), "v_item_stock"));
  });
  if (hasOverdue(r.requested_by)) list.push(check("warn", esc(personName(r.requested_by)) + " has an overdue tool. Not a DB rule, but worth asking.", "v_open_loans"));
  return list;
}

function initRequests() {
  var form = $("#req-form");

  function render() {
    var pending = requests.filter(function (r) { return r.status === "pending"; });
    $("#n-pending").textContent = "(" + pending.length + ")";
    $("#pending-list").innerHTML = pending.length ? pending.map(function (r) {
      var list = requestChecks(r), blocked = !allPass(list);
      var fails = list.filter(function (c) { return c.state === "fail"; }).map(function (c) { return c.text.replace(/<[^>]+>/g, ""); });
      return '<article class="req' + (blocked ? " is-blocked" : "") + '" id="req-' + r.request_id + '" aria-labelledby="req-h-' + r.request_id + '">' +
        '<div class="req-head"><h3 id="req-h-' + r.request_id + '">' + esc(personName(r.requested_by)) + '</h3><span class="req-no">' + reqNo(r) + "</span>" +
        (blocked ? stamp("stamp-alert", "&#10005;", "Blocked") : stamp("", "&#9711;", "Pending")) +
        '<span class="muted">Requested ' + fmtDateTime(r.requested_at) + (r.remarks ? " &middot; " + esc(r.remarks) : "") + "</span></div>" +
        '<div class="req-body"><ul class="lines">' + r.lines.map(function (l) {
          var it = itemOf(l.item_id);
          return "<li><span>" + esc(it.name) + ' <span class="muted">' + (it.item_type === "tool" ? "tool, due " + fmtDate(l.due_date) : "consumable, no due date") +
            '</span></span><span class="qty">&times;' + l.quantity + "</span></li>";
        }).join("") + "</ul>" +
        '<h4 class="checks-title">Inspection</h4><ul class="checks">' + checksHTML(list) + "</ul>" +
        '<p class="error" id="req-err-' + r.request_id + '" tabindex="-1" hidden>Can\'t approve: ' + esc(fails.join(" ")) + "</p>" +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-approve="' + r.request_id + '"' + (blocked ? ' aria-disabled="true" aria-describedby="req-err-' + r.request_id + '"' : "") + ">Approve</button>" +
        '<button class="btn" type="button" data-reject="' + r.request_id + '"' + (r.requested_by === ME ? ' aria-disabled="true" aria-describedby="req-err-' + r.request_id + '"' : "") + '>Reject</button></div>' +
        '<div class="reject-box" hidden><div class="field"><label for="why-' + r.request_id + '">Reason for rejecting <code>remarks</code></label>' +
        '<textarea id="why-' + r.request_id + '"></textarea><p class="hint">The member sees this, so say what to do instead.</p><p class="error" hidden>Give a reason before rejecting.</p></div>' +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-confirm-reject="' + r.request_id + '">Reject request</button><button class="btn" type="button" data-cancel>Keep pending</button></div></div>' +
        "</div></article>";
    }).join("") : '<p class="empty">No pending requests. Everything has been decided.</p>';

    $all("[data-approve]").forEach(function (b) {
      var r = byId(requests, "request_id", parseInt(b.getAttribute("data-approve"), 10));
      if (b.getAttribute("aria-disabled") === "true") {
        b.addEventListener("click", function () { var err = $("#req-err-" + r.request_id); err.hidden = false; err.focus(); });
      } else twoTap(b, "Tap again to approve", function () { approve(r); });
    });
    $all("[data-confirm-reject]").forEach(function (b) {
      var r = byId(requests, "request_id", parseInt(b.getAttribute("data-confirm-reject"), 10));
      twoTap(b, "Tap again to reject", function () {
        var ta = $("#why-" + r.request_id);
        if (!ta.value.trim()) { setError(ta); ta.focus(); b.classList.remove("armed"); b.textContent = "Reject request"; return; }
        if (r.requested_by === ME) { toast("You can't decide your own request (chk_request_not_self). Ask another officer."); return; }
        r.status = "rejected"; r.decided_by = ME; r.decided_at = nowStamp(); r.remarks = ta.value.trim();
        render(); toast("Rejected " + reqNo(r) + " for " + personName(r.requested_by) + ".");
      });
    });

    var loans = openLoans();
    $("#n-loans").textContent = "(" + loans.length + ")";
    loans.forEach(function (l) { l._alert = l.overdue; });
    renderRows($("#loans-table"), loans, [
      { label: "Borrower", html: function (l) { return esc(personName(l.req.requested_by)) + "<small>" + reqNo(l.req) + "</small>"; } },
      { label: "Tool", html: function (l) { return esc(l.item.name); } },
      { label: "Qty", cls: "num", html: function (l) { return l.line.quantity; } },
      { label: "Borrowed", html: function (l) { return fmtDateTime(l.req.decided_at); } },
      { label: "Due", html: function (l) { return fmtDate(l.line.due_date); } },
      { label: "Status", html: function (l) { return l.overdue ? stamp("stamp-alert", "&#9888;", "Overdue") : stamp("", "&#10003;", "On time"); } },
      { label: "Actions", cls: "actions", html: function (l) {
        return '<button class="btn btn-sm" type="button" data-return="' + l.req.request_id + "-" + l.item.item_id + '">Mark returned<span class="sr-only"> ' + esc(l.item.name) + ", " + esc(personName(l.req.requested_by)) + "</span></button>";
      } }
    ], "No tools are out.");
    $all("[data-return]").forEach(function (b) {
      var ids = b.getAttribute("data-return").split("-");
      twoTap(b, "Tap again: returned", function () { markReturned(parseInt(ids[0], 10), parseInt(ids[1], 10)); });
    });

    var hist = requests.filter(function (r) { return r.status !== "pending"; }).sort(function (a, b) { return b.request_id - a.request_id; });
    var STAMPS = { approved: ["", "&#10003;", "Approved"], rejected: ["stamp-quiet", "&#10005;", "Rejected"], completed: ["stamp-solid", "&#9632;", "Completed"] };
    renderRows($("#hist-table"), hist, [
      { label: "Requester", html: function (r) { return esc(personName(r.requested_by)); } },
      { label: "No.", html: function (r) { return reqNo(r); } },
      { label: "Items", html: function (r) { return esc(r.lines.map(lineText).join(", ")); } },
      { label: "Status", html: function (r) { var s = STAMPS[r.status]; return stamp(s[0], s[1], s[2]); } },
      { label: "Decided by", html: function (r) { return esc(personName(r.decided_by)) + "<br><span class=\"muted\">" + fmtDateTime(r.decided_at) + "</span>"; } },
      { label: "Remarks", html: function (r) { return r.remarks ? esc(r.remarks) : '<span class="muted">None</span>'; } }
    ]);
    refreshForm();
  }

  function approve(r) {
    if (!allPass(requestChecks(r))) { render(); return; } // stock may have changed since the first tap
    r.status = "approved"; r.decided_by = ME; r.decided_at = nowStamp();
    r.lines.forEach(function (l) { itemOf(l.item_id).available -= l.quantity; });
    // Consumable-only requests have nothing to return, so they are complete at once
    if (!r.lines.some(function (l) { return itemOf(l.item_id).item_type === "tool"; })) r.status = "completed";
    render();
    toast("Approved " + reqNo(r) + " for " + personName(r.requested_by) + ". Stock now: " +
      r.lines.map(function (l) { var it = itemOf(l.item_id); return it.name + " " + it.available; }).join(", ") + ".");
  }
  function markReturned(requestId, itemId) {
    var r = byId(requests, "request_id", requestId), l = byId(r.lines, "item_id", itemId), it = itemOf(itemId);
    l.returned_at = nowStamp(); it.available += l.quantity;
    var toolsOut = r.lines.some(function (x) { return itemOf(x.item_id).item_type === "tool" && !x.returned_at; });
    if (!toolsOut) r.status = "completed";
    render();
    toast(it.name + " returned by " + personName(r.requested_by) + ". " + it.available + " available." + (!toolsOut ? " " + reqNo(r) + " completed." : ""));
  }

  // Reject: first reveal the reason box
  $("#pending-list").addEventListener("click", function (e) {
    var rj = e.target.closest("[data-reject]"), cancel = e.target.closest("[data-cancel]");
    if (rj && rj.getAttribute("aria-disabled") === "true") { var err = $("#req-err-" + rj.getAttribute("data-reject")); err.textContent = "You can't decide your own request, approve or reject (chk_request_not_self). Ask another officer."; err.hidden = false; err.focus(); return; }
    if (rj) { var box = $(".reject-box", rj.closest(".req")); box.hidden = false; $("textarea", box).focus(); }
    if (cancel) { cancel.closest(".reject-box").hidden = true; }
  });

  /* New request form with item lines */
  var active = members.filter(function (m) { return m.is_active; });
  form.requested_by.innerHTML = '<option value="">Choose a member</option>' + active.map(function (m) {
    return '<option value="' + m.person_id + '">' + esc(personName(m.person_id)) + "</option>";
  }).join("");
  var lineCount = 0;
  function addLine() {
    lineCount++;
    var n = lineCount, div = document.createElement("div");
    div.className = "line-row";
    div.innerHTML =
      '<div class="field"><label for="ln-item-' + n + '">Item <code>item_id</code></label><select id="ln-item-' + n + '" class="ln-item"><option value="">Choose an item</option>' +
      items.filter(function (i) { return i.is_active; }).map(function (i) { return '<option value="' + i.item_id + '">' + esc(i.name) + " (" + i.item_type + ", " + i.available + " available)</option>"; }).join("") +
      '</select></div><div class="field"><label for="ln-qty-' + n + '">Qty <code>quantity</code></label><input id="ln-qty-' + n + '" class="ln-qty" type="number" min="1" value="1" inputmode="numeric"></div>' +
      '<div class="field ln-due-field"><label for="ln-due-' + n + '">Due <code>due_date</code></label><input id="ln-due-' + n + '" class="ln-due" type="date" min="' + TODAY + '"><p class="hint ln-due-note"></p></div>' +
      '<button class="btn btn-sm" type="button" data-remove aria-label="Remove this item">Remove</button>';
    $("#rq-lines").appendChild(div);
    refreshForm();
  }
  function lines() {
    return $all(".line-row", form).map(function (row) {
      var id = parseInt($(".ln-item", row).value, 10);
      return { row: row, item: id ? itemOf(id) : null, qty: parseInt($(".ln-qty", row).value, 10), due: $(".ln-due", row).value };
    });
  }
  function formChecks() {
    var ls = lines(), chosen = ls.filter(function (l) { return l.item; });
    var ids = chosen.map(function (l) { return l.item.item_id; });
    var dupe = ids.some(function (id, i) { return ids.indexOf(id) !== i; });
    var tools = chosen.filter(function (l) { return l.item.item_type === "tool"; });
    var short = chosen.filter(function (l) { return l.qty > l.item.available; });
    var list = [
      check(form.requested_by.value ? "pass" : "todo", "Requester is an active member", "fk_request_requested_by"),
      check(chosen.length ? "pass" : "todo", "At least one item", "request_line"),
      check(dupe ? "fail" : chosen.length ? "pass" : "todo", dupe ? "The same item is listed twice. Put it on one line with a bigger quantity." : "Each item on one line only", "uq_line_request_item"),
      check(ls.some(function (l) { return !(l.qty > 0); }) ? "fail" : "pass", "Every quantity is 1 or more", "chk_line_qty"),
      check(!tools.length ? "todo" : tools.every(function (l) { return l.due && l.due >= TODAY; }) ? "pass" : "fail", "Tools have a due date from today on; consumables get none", "trg_line_consumable_ins")
    ];
    if (short.length) list.push(check("warn", "More than available now: " + short.map(function (l) { return esc(l.item.name) + " (" + l.item.available + ")"; }).join(", ") + ". It can't be approved until stock returns.", "v_item_stock"));
    return list;
  }
  function refreshForm() {
    lines().forEach(function (l) {
      var isTool = !l.item || l.item.item_type === "tool", due = $(".ln-due", l.row);
      due.disabled = !isTool;
      if (!isTool) due.value = "";
      $(".ln-due-note", l.row).textContent = isTool ? "" : "Consumable: no due date";
      $("[data-remove]", l.row).hidden = $all(".line-row", form).length === 1;
    });
    $("#rq-checks").innerHTML = checksHTML(formChecks());
  }
  $("#rq-add").addEventListener("click", function () { addLine(); $(".line-row:last-child .ln-item", form).focus(); });
  form.addEventListener("click", function (e) { var b = e.target.closest("[data-remove]"); if (b) { b.closest(".line-row").remove(); refreshForm(); } });
  form.addEventListener("input", refreshForm);
  form.addEventListener("change", refreshForm);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var c = formChecks();
    if (!form.requested_by.value) setError(form.requested_by);
    if (!allPass(c)) {
      var msg = c.filter(function (x) { return x.state !== "pass" && x.state !== "warn"; }).map(function (x) { return x.text.replace(/<[^>]+>/g, ""); });
      toast("Fix before saving: " + msg.join(" "));
      lines().forEach(function (l) {
        if (!l.item) $(".ln-item", l.row).setAttribute("aria-invalid", "true");
        if (l.item && l.item.item_type === "tool" && !(l.due >= TODAY)) $(".ln-due", l.row).setAttribute("aria-invalid", "true");
        if (!(l.qty > 0)) $(".ln-qty", l.row).setAttribute("aria-invalid", "true");
      });
      focusFirstError(form); return;
    }
    var r = { request_id: Math.max.apply(null, requests.map(function (x) { return x.request_id; })) + 1, requested_by: parseInt(form.requested_by.value, 10),
      decided_by: null, requested_at: nowStamp(), decided_at: null, status: "pending", remarks: form.remarks.value.trim(),
      lines: lines().map(function (l) { return { item_id: l.item.item_id, quantity: l.qty, due_date: l.item.item_type === "tool" ? l.due : null, returned_at: null }; }) };
    requests.push(r);
    form.reset(); $("#rq-lines").innerHTML = ""; addLine();
    render();
    toast("Saved " + reqNo(r) + " for " + personName(r.requested_by) + ". It is now in Pending.");
  });

  addLine();
  render();
}

/* =========================================================
   06 REPORTS
   ========================================================= */
// Bold the SQL keywords (text is escaped first)
function sqlHTML(sql) {
  return esc(sql).replace(/\b(SELECT|FROM|JOIN|ON|WHERE|AND|OR|GROUP BY|ORDER BY|DESC|ASC|AS|IN|LIMIT|COUNT|SUM|DATE|IS NULL|CURDATE)\b/g, '<span class="kw">$1</span>');
}
function initReports() {
  var attPerDay = function () {
    var map = {};
    attendance.forEach(function (a) { var k = a.time_in.substr(0, 10) + "|" + purposeName(a.purpose_id); map[k] = (map[k] || 0) + 1; });
    return Object.keys(map).sort().reverse().map(function (k) { var p = k.split("|"); return [fmtDate(p[0]), p[1], map[k]]; });
  };
  var mostBorrowed = function () {
    var map = {};
    requests.forEach(function (r) {
      if (r.status !== "approved" && r.status !== "completed") return;
      r.lines.forEach(function (l) { map[l.item_id] = (map[l.item_id] || 0) + l.quantity; });
    });
    return Object.keys(map).map(function (id) { return [itemOf(parseInt(id, 10)).name, map[id]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
  };
  var reports = [
    { id: "open-loans", title: "Open loans", desc: "Tools out right now, who has them, and when they are due.",
      sql: "SELECT first_name, last_name, item_name, quantity, due_date, is_overdue\nFROM v_open_loans\nORDER BY due_date;",
      cols: ["Borrower", "item_name", "quantity", "due_date", "is_overdue"],
      rows: function () { return openLoans().map(function (l) { return [personName(l.req.requested_by), l.item.name, l.line.quantity, fmtDate(l.line.due_date), l.overdue ? "1 (yes)" : "0"]; }); } },
    { id: "overdue", title: "Overdue tools", desc: "The same view, only rows past their due_date.",
      sql: "SELECT first_name, last_name, contact_number, item_name, due_date\nFROM v_open_loans\nWHERE is_overdue = 1\nORDER BY due_date;",
      cols: ["Borrower", "contact_number", "item_name", "due_date"],
      rows: function () { return openLoans().filter(function (l) { return l.overdue; }).map(function (l) { return [personName(l.req.requested_by), byId(persons, "person_id", l.req.requested_by).contact_number, l.item.name, fmtDate(l.line.due_date)]; }); } },
    { id: "low-stock", title: "Low stock", desc: "Active items at or below their reorder_level, from v_low_stock.",
      sql: "SELECT name, quantity_available, reorder_level\nFROM v_low_stock\nORDER BY quantity_available;",
      cols: ["name", "quantity_available", "reorder_level"],
      rows: function () { return lowStock().map(function (i) { return [i.name, i.available, i.reorder_level]; }); } },
    { id: "attendance", title: "Attendance per day and purpose", desc: "How many sign-ins each day, split by purpose.",
      sql: "SELECT DATE(a.time_in) AS day, p.name AS purpose, COUNT(*) AS visits\nFROM attendance a\nJOIN purpose p ON p.purpose_id = a.purpose_id\nGROUP BY day, p.name\nORDER BY day DESC, visits DESC;",
      cols: ["day", "purpose", "visits"], rows: attPerDay },
    { id: "most-borrowed", title: "Most borrowed items", desc: "Total quantity on approved and completed requests.",
      sql: "SELECT i.name, SUM(rl.quantity) AS times_borrowed\nFROM request_line rl\nJOIN item_request q ON q.request_id = rl.request_id\nJOIN item i ON i.item_id = rl.item_id\nWHERE q.status IN ('approved', 'completed')\nGROUP BY i.item_id, i.name\nORDER BY times_borrowed DESC\nLIMIT 5;",
      cols: ["name", "times_borrowed"], rows: mostBorrowed },
    { id: "inside", title: "Who is inside now", desc: "Open attendance rows: signed in, not yet out.",
      sql: "SELECT p.first_name, p.last_name, pu.name AS purpose, a.time_in\nFROM attendance a\nJOIN person p ON p.person_id = a.person_id\nJOIN purpose pu ON pu.purpose_id = a.purpose_id\nWHERE a.time_out IS NULL\nORDER BY a.time_in;",
      cols: ["Name", "purpose", "time_in"],
      rows: function () { return attendance.filter(function (a) { return !a.time_out; }).map(function (a) { return [personName(a.person_id), purposeName(a.purpose_id), fmtTime(a.time_in)]; }); } }
  ];
  $("#report-nav").innerHTML = reports.map(function (r) { return '<a href="#' + r.id + '">' + esc(r.title) + "</a>"; }).join("") + '<a href="#rules">Business rules</a>';
  $("#reports").innerHTML = reports.map(function (r, n) {
    var rows = r.rows();
    return '<section class="report" id="' + r.id + '" aria-labelledby="' + r.id + '-h"><div class="panel-head"><h2 id="' + r.id + '-h">' + (n + 1) + ". " + esc(r.title) +
      "</h2><code>" + rows.length + " row" + (rows.length === 1 ? "" : "s") + '</code></div><p class="panel-body" style="margin:0;padding-bottom:0">' + esc(r.desc) + "</p>" +
      '<div class="report-grid" style="margin-top:16px"><pre class="sql" aria-label="SQL query"><code>' + sqlHTML(r.sql) + "</code></pre>" +
      '<div class="report-result"><table class="data"><thead><tr>' + r.cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      (rows.length ? rows.map(function (row) {
        return "<tr>" + row.map(function (v, i) { return '<td data-label="' + esc(r.cols[i]) + '"' + (i === 0 ? ' class="lead"' : "") + ">" + esc(v) + "</td>"; }).join("") + "</tr>";
      }).join("") : '<tr class="empty-row"><td colspan="' + r.cols.length + '">No rows.</td></tr>') + "</tbody></table></div></div></section>";
  }).join("");

  var rules = [
    ["A member must have a student ID", "trg_member_requires_student_id_ins", "People form, kiosk Visitor note"],
    ["A member can't lose their student ID", "trg_person_keep_student_id_upd", "People (no way to clear it in the UI)"],
    ["Only an active member whose role can_approve decides", "trg_request_approver_ins / _upd", "Requests inspection, Settings roles"],
    ["Nobody approves their own request", "chk_request_not_self", "Requests inspection (No. 0012 is blocked for Paolo)"],
    ["Pending has no decider; decided has both decider and time", "chk_request_decision", "Approve and Reject fill decided_by and decided_at"],
    ["Consumables have no due date or return time", "trg_line_consumable_ins / _upd", "New request (due date off), Out on loan lists tools only"],
    ["time_out is after time_in", "chk_attendance_times", "Kiosk sets time_out at sign-out time"],
    ["Quantities are more than 0", "chk_line_qty, chk_restock_qty", "New request, Restock checks"],
    ["Names are unique", "uq_item_name, uq_role_name, uq_purpose_name, uq_category_name", "Item form and Settings checks"],
    ["Student IDs are unique", "uq_person_student_id", "People form check"],
    ["Don't approve more than quantity_available (not in the DB)", "v_item_stock, checked by the UI and PHP", "Requests: Approve is blocked with the reason"]
  ];
  renderRows($("#rules-table"), rules, [
    { label: "Rule", html: function (r) { return esc(r[0]); } },
    { label: "Enforced by", html: function (r) { return "<code>" + esc(r[1]) + "</code>"; } },
    { label: "Checked on screen", html: function (r) { return esc(r[2]); } }
  ]);
}

/* =========================================================
   07 SETTINGS
   ========================================================= */
function initSettings() {
  var lookups = { role: roles, purpose: purposes, category: categories };
  function render() {
    renderRows($("#roles-table"), roles, [
      { label: "Role", html: function (r) { return esc(r.name); } },
      { label: "Can approve", html: function (r) {
        return '<label class="check-line"><input type="checkbox" data-role="' + r.role_id + '"' + (r.can_approve ? " checked" : "") + "> " + (r.can_approve ? "Yes" : "No") +
          '<span class="sr-only"> for ' + esc(r.name) + "</span></label>";
      } }
    ]);
    renderRows($("#purpose-table"), purposes, [
      { label: "Purpose", html: function (p) { return esc(p.name); } },
      { label: "Used", cls: "num", html: function (p) { return attendance.filter(function (a) { return a.purpose_id === p.purpose_id; }).length; } }
    ]);
    renderRows($("#category-table"), categories, [
      { label: "Category", html: function (c) { return esc(c.name); } },
      { label: "Items", cls: "num", html: function (c) { return items.filter(function (i) { return i.category_id === c.category_id; }).length; } }
    ]);
  }
  $("#roles-table").addEventListener("change", function (e) {
    var r = byId(roles, "role_id", parseInt(e.target.getAttribute("data-role"), 10));
    r.can_approve = e.target.checked; render();
    toast(r.name + (r.can_approve ? " can now approve requests." : " can no longer approve requests."), function () { r.can_approve = !r.can_approve; render(); });
  });
  $all(".lookup-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);
      var table = form.getAttribute("data-table"), list = lookups[table], name = form.name.value.trim();
      if (!name) { setError(form.name, "Enter a name."); form.name.focus(); return; }
      if (list.some(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })) { setError(form.name, name + " already exists (uq_" + table + "_name)."); form.name.focus(); return; }
      var row = { name: name };
      row[table + "_id"] = list.length + 1;
      if (table === "role") row.can_approve = form.can_approve.checked;
      list.push(row); form.reset(); render();
      toast("Added " + name + " to " + table + ".");
    });
  });
  render();
}

/* ---------- Start the right page ---------- */
setupMenu();
var PAGES = { kiosk: initKiosk, dashboard: initDashboard, attendance: initAttendance, people: initPeople,
  items: initItems, requests: initRequests, reports: initReports, settings: initSettings };
PAGES[document.body.getAttribute("data-page")]();
