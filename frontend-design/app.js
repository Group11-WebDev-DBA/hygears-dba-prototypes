/* Hygears HQ System prototype: page behaviour.
   Plain functions, one per job. Nothing is saved: reloading a page resets its sample data.
   In the PHP rebuild each "save" below becomes a form POST with the same field names. */

// ---------- Shared helpers ----------

function $(selector, root) { return (root || document).querySelector(selector); }
function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

// Escape text typed by a user before putting it into innerHTML (htmlspecialchars in PHP)
function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Show a message box. kind is "ok", "alert" or "" (neutral)
function showMsg(box, html, kind, focusIt) {
  box.classList.remove("msg-ok", "msg-alert");
  if (kind) { box.classList.add("msg-" + kind); }
  box.innerHTML = html;
  box.hidden = false;
  if (focusIt) { box.focus(); }
}

// Mark one field as wrong. The error element's id is the field id + "-error"
function setError(field, text) {
  var error = document.getElementById(field.id + "-error");
  field.setAttribute("aria-invalid", "true");
  if (error) { error.textContent = text; error.hidden = false; }
}

function clearErrors(form) {
  $all("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });
  $all(".error", form).forEach(function (e) { e.hidden = true; e.textContent = ""; });
}

function focusFirstError(form) {
  var bad = $("[aria-invalid='true']", form);
  if (bad) { bad.focus(); }
}

// Current time as HH:MM
function nowTime() {
  var d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function digitsOnly(text) { return String(text).replace(/\D/g, ""); }

// Philippine mobile number: 11 digits starting with 09
function isContactNumber(text) { return /^09\d{9}$/.test(digitsOnly(text)); }

// PUP student number format, e.g. 2023-00141-MN-0.
// At the door people type only the 9 digits (one thumb, number pad), so "2023 00141" becomes 2023-00141-MN-0.
function normalizeStudentId(text) {
  var t = String(text).trim().toUpperCase().replace(/\s+/g, "");
  var digits = t.replace(/-/g, "");
  if (/^\d{9}$/.test(digits)) { return digits.slice(0, 4) + "-" + digits.slice(4) + "-MN-0"; }
  return t;
}
function isStudentId(text) { return /^\d{4}-\d{5}-[A-Z]{2}-\d$/.test(text); }

// "2026-11-26" -> "26 Nov"
function shortDate(iso) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var parts = iso.split("-");
  return Number(parts[2]) + " " + months[Number(parts[1]) - 1];
}

var TODAY = "2026-11-24"; // sample "today"; PHP uses CURDATE()

// ---------- Menu button (phones and tablets) ----------

function setupMenu() {
  var button = $(".menu-btn");
  var nav = $("#site-nav");
  if (!button || !nav) { return; }
  button.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// ---------- Kiosk: HQ door (index.html) ----------

// person rows with a student_id. PHP: SELECT ... FROM person LEFT JOIN member ... WHERE student_id = ?
var PEOPLE = {
  "2023-00141-MN-0": { person_id: 1, name: "Mika Reyes", kind: "Member" },
  "2022-00377-MN-0": { person_id: 2, name: "Paolo Santos", kind: "Officer" },
  "2022-00512-MN-0": { person_id: 3, name: "Bea Villanueva", kind: "President" },
  "2024-00088-MN-0": { person_id: 4, name: "Carlo Mendoza", kind: "Member" },
  "2023-00620-MN-0": { person_id: 5, name: "Jessa Ramos", kind: "Member" },
  "2021-00733-MN-0": { person_id: 6, name: "Ken Bautista", kind: "Officer" },
  "2025-01234-MN-0": { person_id: 8, name: "Nico Ferrer", kind: "PUP student" }
};
// Visitors are found again by contact_number so they don't get a second person row
var VISITORS = { "09170000107": { person_id: 7, name: "Lara Gomez", affiliation: "TUP Manila" } };
var PURPOSES = { 1: "Meeting", 2: "Project work", 3: "Workshop", 4: "Tool use", 5: "Study", 6: "Visit" };

var kiosk = { needsDetails: false, nextPersonId: 9, lastRemoved: null, hideTimer: null };

function setupKiosk() {
  var form = $("#signin-form");
  if (!form) { return; }

  $all("input[name='kind']", form).forEach(function (radio) {
    radio.addEventListener("change", function () { kiosk.needsDetails = false; showKioskFields(); });
  });
  form.addEventListener("submit", signIn);
  // A new student number hides the first-visit fields again
  $("#student_id").addEventListener("input", function () {
    if (kiosk.needsDetails) { kiosk.needsDetails = false; showKioskFields(); }
  });
  $("#tagboard").addEventListener("click", function (e) {
    var button = e.target.closest("[data-signout]");
    if (button) { signOut(button.closest(".person-tag")); }
  });
  $("#signout-msg").addEventListener("click", function (e) {
    if (e.target.closest("[data-undo]")) { undoSignOut(); }
  });
  $("#signin-msg").addEventListener("click", function (e) {
    var button = e.target.closest("[data-show-tag]");
    if (button) { showTag(button.getAttribute("data-show-tag")); }
  });
  showKioskFields();
  updateClock();
  setInterval(updateClock, 30000);
}

function kioskKind() { return $("input[name='kind']:checked").value; }

// Show the right fields for a PUP student, a first-time student, or a visitor
function showKioskFields() {
  var visitor = kioskKind() === "visitor";
  $("#student-fields").hidden = visitor;
  $("#detail-fields").hidden = !(visitor || kiosk.needsDetails);
  $("#affiliation-field").hidden = !visitor;
  $("#detail-note").textContent = visitor
    ? "If you've visited before, use the same contact number and we'll find you."
    : "This student number isn't on the list yet. Add your name and number once, then tap Sign in.";
}

function updateClock() {
  var clock = $("#clock");
  var d = new Date();
  var date = d.toLocaleDateString("en-PH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  clock.innerHTML = nowTime() + "<span>" + date + "</span>";
}

// Find a tag on the board for the same person (stops signing in twice)
function findInside(person) {
  return $all("#tagboard .person-tag").filter(function (tag) {
    if (person.person_id && tag.getAttribute("data-person-id") === String(person.person_id)) { return true; }
    if (person.student_id && tag.getAttribute("data-student-id") === person.student_id) { return true; }
    if (person.contact && tag.getAttribute("data-contact") === person.contact) { return true; }
    return person.name && tag.getAttribute("data-name").toLowerCase() === person.name.toLowerCase();
  })[0];
}

function signIn(e) {
  e.preventDefault();
  var form = e.target;
  clearErrors(form);
  var visitor = kioskKind() === "visitor";
  var person = null;

  if (!visitor) {
    var sidField = $("#student_id");
    var sid = normalizeStudentId(sidField.value);
    sidField.value = sid;
    if (!sid) { setError(sidField, "Enter your student number."); }
    else if (!isStudentId(sid)) { setError(sidField, "Type the 9 digits on your ID, like 2023 00141."); }
    else if (PEOPLE[sid]) {
      person = { person_id: PEOPLE[sid].person_id, student_id: sid, name: PEOPLE[sid].name, kind: PEOPLE[sid].kind };
    } else if (!kiosk.needsDetails) {
      // First visit: ask for the person row details, keep what they typed
      kiosk.needsDetails = true;
      showKioskFields();
      $("#first_name").focus();
      return;
    }
  }

  if (visitor || (kiosk.needsDetails && !person)) {
    var first = $("#first_name"), last = $("#last_name"), contact = $("#contact_number"), aff = $("#affiliation");
    if (!first.value.trim()) { setError(first, "Enter your first name."); }
    if (!last.value.trim()) { setError(last, "Enter your last name."); }
    if (!contact.value.trim()) { setError(contact, "Enter a contact number."); }
    else if (!isContactNumber(contact.value)) { setError(contact, "Use 11 digits starting with 09, like 0917 123 4567."); }
    if (visitor && !aff.value.trim()) { setError(aff, "Enter your school or organization."); }
    if (!person) {
      var digits = digitsOnly(contact.value);
      var known = visitor ? VISITORS[digits] : null;
      person = {
        person_id: known ? known.person_id : null,
        student_id: visitor ? "" : normalizeStudentId($("#student_id").value),
        name: known ? known.name : (first.value.trim() + " " + last.value.trim()),
        contact: digits,
        kind: visitor ? "Visitor from " + aff.value.trim() : "PUP student"
      };
    }
  }

  var purpose = $("input[name='purpose_id']:checked", form);
  if (!purpose) {
    $("#purpose-error").textContent = "Choose why you're here.";
    $("#purpose-error").hidden = false;
    $("#purpose-set").setAttribute("aria-invalid", "true");
  }

  if ($("[aria-invalid='true']", form)) {
    var bad = $("[aria-invalid='true']", form);
    (bad.tagName === "FIELDSET" ? $("input", bad) : bad).focus();
    return;
  }

  var msg = $("#signin-msg");
  var already = findInside(person);
  if (already) {
    showMsg(msg, "<strong>" + esc(already.getAttribute("data-name")) + " is already inside.</strong>" +
      "<p>Signed in at " + already.getAttribute("data-time") + ". Leaving? Tap Sign out on your tag instead.</p>" +
      "<button class='btn' type='button' data-show-tag='" + already.getAttribute("data-attendance-id") + "'>Show my tag</button>", "alert", true);
    return;
  }

  if (!person.person_id) {
    person.person_id = kiosk.nextPersonId++;   // PHP: INSERT INTO person, then LAST_INSERT_ID()
    if (person.student_id) { PEOPLE[person.student_id] = { person_id: person.person_id, name: person.name, kind: "PUP student" }; }
    else { VISITORS[person.contact] = { person_id: person.person_id, name: person.name }; }
  }
  addTag(person, PURPOSES[purpose.value], nowTime());
  showMsg(msg, "<strong>Welcome, " + esc(person.name.split(" ")[0]) + ".</strong>" +
    "<p>Signed in at " + nowTime() + " for " + PURPOSES[purpose.value] + ". Your tag is on the board.</p>", "ok", true);
  clearTimeout(kiosk.hideTimer);
  kiosk.hideTimer = setTimeout(function () { msg.hidden = true; }, 12000);

  form.reset();
  kiosk.needsDetails = false;
  showKioskFields();
}

var nextAttendanceId = 219;

// Put a new tag on the board. PHP: INSERT INTO attendance (person_id, purpose_id) VALUES (?, ?)
function addTag(person, purposeName, time) {
  var li = document.createElement("li");
  li.className = "person-tag is-new";
  li.setAttribute("data-attendance-id", nextAttendanceId++);
  li.setAttribute("data-person-id", person.person_id);
  li.setAttribute("data-student-id", person.student_id || "");
  li.setAttribute("data-name", person.name);
  li.setAttribute("data-contact", person.contact || "");
  li.setAttribute("data-time", time);
  li.innerHTML = "<div><h3>" + esc(person.name) + "</h3><p>" + esc(person.kind) + ", " + purposeName + "</p><p>In since " + time + "</p></div>" +
    "<button class='btn' type='button' data-signout>Sign out<span class='visually-hidden'> " + esc(person.name) + "</span></button>";
  $("#tagboard").insertBefore(li, $("#tagboard").firstChild);
  updateInsideCount();
}

// PHP: UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?
function signOut(tag) {
  kiosk.lastRemoved = { tag: tag, next: tag.nextSibling };
  tag.parentNode.removeChild(tag);
  tag.classList.remove("is-new");
  updateInsideCount();
  showMsg($("#signout-msg"), "<p><strong>Signed out: " + esc(tag.getAttribute("data-name")) + "</strong> at " + nowTime() + ".</p>" +
    "<button class='btn btn-small' type='button' data-undo>Undo, that wasn't me</button>", "ok", true);
}

function undoSignOut() {
  var last = kiosk.lastRemoved;
  if (!last) { return; }
  $("#tagboard").insertBefore(last.tag, last.next);
  kiosk.lastRemoved = null;
  updateInsideCount();
  showMsg($("#signout-msg"), "<p>" + esc(last.tag.getAttribute("data-name")) + " is back on the board.</p>", "", true);
}

function showTag(attendanceId) {
  var tag = $("#tagboard [data-attendance-id='" + attendanceId + "']");
  if (tag) { tag.scrollIntoView({ block: "center" }); $("button", tag).focus(); }
}

function updateInsideCount() {
  var count = $all("#tagboard .person-tag").length;
  $all(".inside-count").forEach(function (el) { el.textContent = count; });
  $("#inside-empty").hidden = count > 0;
}

// ---------- Attendance log ----------

function setupAttendance() {
  var form = $("#attendance-filters");
  if (!form) { return; }
  $all("select, input", form).forEach(function (f) { f.addEventListener("change", filterAttendance); });
  $("#export-btn").addEventListener("click", exportAttendance);
  filterAttendance();
}

function filterAttendance() {
  var date = $("#f-date").value, purpose = $("#f-purpose").value, kind = $("#f-kind").value, insideOnly = $("#f-inside").checked;
  var rows = $all("#attendance-table tbody tr[data-date]");
  var shown = 0;
  rows.forEach(function (row) {
    var match = (!date || row.getAttribute("data-date") === date) &&
      (!purpose || row.getAttribute("data-purpose") === purpose) &&
      (!kind || row.getAttribute("data-kind") === kind) &&
      (!insideOnly || row.getAttribute("data-inside") === "1");
    row.hidden = !match;
    if (match) { shown++; }
  });
  $("#attendance-empty").hidden = shown > 0;
  $("#attendance-count").textContent = "Showing " + shown + " of " + rows.length + " sign-ins";
}

// Downloads the visible rows as CSV (the PHP version would stream the same query)
function exportAttendance() {
  var header = $all("#attendance-table thead th").map(function (th) { return th.textContent; });
  var lines = [header.join(",")];
  $all("#attendance-table tbody tr[data-date]").forEach(function (row) {
    if (row.hidden) { return; }
    lines.push($all("td", row).map(function (td) { return '"' + td.textContent.trim().replace(/"/g, '""') + '"'; }).join(","));
  });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  link.download = "attendance.csv";
  link.click();
  showMsg($("#attendance-msg"), "<p>Downloaded attendance.csv with " + (lines.length - 1) + " rows, matching the filters.</p>", "ok");
}

// ---------- People ----------

function setupPeople() {
  var table = $("#people-table");
  if (!table) { return; }
  $("#p-search").addEventListener("input", filterPeople);
  $("#p-kind").addEventListener("change", filterPeople);
  $("#people-filters").addEventListener("submit", function (e) { e.preventDefault(); });
  table.addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-toggle-active]");
    var make = e.target.closest("[data-make-member]");
    if (toggle) { toggleActive(toggle.closest("tr")); }
    if (make) { makeMember(make.closest("tr")); }
  });
  $("#ap-is-member").addEventListener("change", function () { $("#member-fields").hidden = !this.checked; });
  $("#add-person").addEventListener("submit", addPerson);
}

function filterPeople() {
  var q = $("#p-search").value.trim().toLowerCase(), kind = $("#p-kind").value;
  var shown = 0;
  $all("#people-table tbody tr[data-kind]").forEach(function (row) {
    var match = (!kind || row.getAttribute("data-kind") === kind) && row.textContent.toLowerCase().indexOf(q) !== -1;
    row.hidden = !match;
    if (match) { shown++; }
  });
  $("#people-empty").hidden = shown > 0;
}

function personName(row) { return $(".cell-main", row).firstChild.textContent; }

var ACTIVE_HTML = "<span class='status status-ok'><span class='glyph' aria-hidden='true'>&#10003;</span>Active</span>";
var INACTIVE_HTML = "<span class='status status-off'><span class='glyph' aria-hidden='true'>&#8211;</span>Inactive</span>";

// PHP: UPDATE member SET is_active = NOT is_active WHERE person_id = ?
function toggleActive(row) {
  var cell = $(".active-cell", row), button = $("[data-toggle-active]", row), name = personName(row);
  var nowActive = button.firstChild.textContent === "Activate";
  cell.innerHTML = nowActive ? ACTIVE_HTML : INACTIVE_HTML;
  button.innerHTML = (nowActive ? "Deactivate" : "Activate") + "<span class='visually-hidden'> " + esc(name) + "</span>";
  showMsg($("#people-msg"), "<p>" + esc(name) + " is now " + (nowActive ? "active and can borrow again." : "inactive. They can still sign in at the door but can't borrow or approve.") + "</p>", "ok");
}

// PHP: INSERT INTO member (person_id, role_id, joined_on) VALUES (?, 1, CURDATE())
function makeMember(row) {
  var name = personName(row);
  row.setAttribute("data-kind", "member");
  $("[data-label='role']", row).textContent = "Member";
  var active = $("[data-label='is_active']", row);
  active.className = "active-cell";
  active.innerHTML = ACTIVE_HTML;
  $(".actions", row).innerHTML = "<button class='btn btn-small' type='button' data-toggle-active>Deactivate<span class='visually-hidden'> " + esc(name) + "</span></button>";
  showMsg($("#people-msg"), "<p>" + esc(name) + " is now a member (role Member, joined_on " + TODAY + ").</p>", "ok");
  $(".actions button", row).focus();
}

var nextPersonRowId = 9;

function addPerson(e) {
  e.preventDefault();
  var form = e.target;
  clearErrors(form);
  var first = $("#ap-first_name"), last = $("#ap-last_name"), sid = $("#ap-student_id"), contact = $("#ap-contact_number");
  var studentId = normalizeStudentId(sid.value);
  var isMember = $("#ap-is-member").checked;

  if (!first.value.trim()) { setError(first, "Enter a first name."); }
  if (!last.value.trim()) { setError(last, "Enter a last name."); }
  if (studentId && !isStudentId(studentId)) { setError(sid, "Use the PUP format, like 2025-00456-MN-0."); }
  else if (studentId && $("#people-table").textContent.indexOf(studentId) !== -1) { setError(sid, "That student number already belongs to someone (student_id is unique)."); }
  else if (isMember && !studentId) { setError(sid, "A club member must have a student ID. Add it, or untick member."); }
  if (!isContactNumber(contact.value)) { setError(contact, "Use 11 digits starting with 09."); }
  if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

  var name = first.value.trim() + " " + last.value.trim();
  var role = isMember ? $("#ap-role_id").selectedOptions[0].textContent : "Visitor";
  var aff = $("#ap-affiliation").value.trim();
  var row = document.createElement("tr");
  row.setAttribute("data-kind", isMember ? "member" : "visitor");
  row.innerHTML = "<td data-label='person_id'>" + nextPersonRowId++ + "</td>" +
    "<td class='cell-main'>" + esc(name) + "<span class='sub'>" + esc(isMember ? ($("#ap-email").value || "no email") + ", joined " + $("#ap-joined_on").value : (aff || "No affiliation")) + "</span></td>" +
    "<td data-label='student_id'>" + (studentId ? esc(studentId) : "<span class='muted'>None</span>") + "</td>" +
    "<td data-label='contact_number'>" + esc(contact.value.trim()) + "</td>" +
    "<td data-label='role'>" + esc(role) + "</td>" +
    (isMember ? "<td data-label='is_active' class='active-cell'>" + ACTIVE_HTML + "</td><td class='actions'><button class='btn btn-small' type='button' data-toggle-active>Deactivate<span class='visually-hidden'> " + esc(name) + "</span></button></td>"
      : "<td data-label='is_active'>No member row</td><td class='actions'>" + (studentId ? "<button class='btn btn-small' type='button' data-make-member>Make member<span class='visually-hidden'> " + esc(name) + "</span></button>" : "<span class='hint'>No student_id, so can't be a member</span>") + "</td>");
  $("#people-table tbody").insertBefore(row, $("#people-empty"));
  showMsg($("#add-person-msg"), "<p>Added " + esc(name) + (isMember ? " as " + esc(role) : " as a visitor") + ". They're at the bottom of the list.</p>", "ok", true);
  form.reset();
  $("#member-fields").hidden = true;
}

// ---------- Items and restock ----------

function setupItems() {
  var table = $("#items-table");
  if (!table) { return; }
  itemRows().forEach(renderItem);
  fillRestockSelect();
  $("#i-type").addEventListener("change", filterItems);
  $("#i-low").addEventListener("change", filterItems);
  table.addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    if (edit) { startEdit(edit.closest("tr")); }
  });
  $("#item-form").addEventListener("submit", saveItem);
  $("#item-cancel").addEventListener("click", resetItemForm);
  $("#restock-form").addEventListener("submit", restock);
}

function itemRows() { return $all("#items-table tbody tr[data-item-id]"); }
function num(row, key) { return Number(row.getAttribute("data-" + key)); }

// Is this item at or below its reorder level? (same test as v_low_stock)
function isLow(row) {
  var reorder = row.getAttribute("data-reorder");
  return row.getAttribute("data-active") === "1" && reorder !== "" && num(row, "available") <= Number(reorder);
}

// Draw the slots (tools) or bin gauge (consumables) and the status for one row
function renderItem(row) {
  var total = num(row, "total"), available = num(row, "available"), out = total - available;
  var stock = $(".stock", row), state = $(".state", row);
  if (row.getAttribute("data-type") === "tool") {
    var slots = "";
    for (var i = 0; i < total; i++) { slots += i < available ? "<li class='slot'></li>" : "<li class='slot out'></li>"; }
    stock.innerHTML = "<div class='stock-cell'><ul class='slots slots-small' aria-hidden='true'>" + slots + "</ul><span class='hint'>" + available + " of " + total + " on the wall</span></div>";
  } else {
    var reorder = Number(row.getAttribute("data-reorder") || 0);
    var scale = Math.max(total, available, 1);
    stock.innerHTML = "<div class='stock-cell'><div class='bin" + (isLow(row) ? " low" : "") + "' aria-hidden='true'><div class='bin-fill' style='width:" + Math.round(available / scale * 100) + "%'></div>" +
      "<div class='bin-mark' style='left:" + Math.round(reorder / scale * 100) + "%'></div></div><span class='hint'>" + available + " left, reorder at " + reorder + "</span></div>";
  }
  var html;
  if (row.getAttribute("data-active") !== "1") { html = "<span class='status status-off'><span class='glyph' aria-hidden='true'>&#8211;</span>Inactive</span>"; }
  else if (isLow(row)) { html = "<span class='status status-alert'><span class='glyph' aria-hidden='true'>!</span>Low stock</span>"; }
  else if (row.getAttribute("data-type") === "tool" && available === 0) { html = "<span class='status status-alert'><span class='glyph' aria-hidden='true'>!</span>All out</span>"; }
  else if (out > 0 && row.getAttribute("data-type") === "tool") { html = "<span class='status status-wait'><span class='glyph' aria-hidden='true'>&#9675;</span>" + out + " out</span>"; }
  else { html = "<span class='status status-ok'><span class='glyph' aria-hidden='true'>&#10003;</span>In stock</span>"; }
  state.innerHTML = html;
  row.classList.toggle("row-alert", isLow(row));
}

function filterItems() {
  var type = $("#i-type").value, lowOnly = $("#i-low").checked, shown = 0;
  itemRows().forEach(function (row) {
    var match = (!type || row.getAttribute("data-type") === type) && (!lowOnly || isLow(row));
    row.hidden = !match;
    if (match) { shown++; }
  });
  $("#items-empty").hidden = shown > 0;
}

function fillRestockSelect() {
  var select = $("#rs-item_id");
  var html = "<option value=''>Choose a consumable</option>";
  itemRows().forEach(function (row) {
    if (row.getAttribute("data-type") === "consumable") {
      html += "<option value='" + row.getAttribute("data-item-id") + "'>" + esc(row.getAttribute("data-name")) + " (" + row.getAttribute("data-available") + " left)</option>";
    }
  });
  var keep = select.value;
  select.innerHTML = html;
  select.value = keep;
}

// PHP: INSERT INTO restock (item_id, quantity, restocked_on, notes) VALUES (?, ?, ?, ?)
function restock(e) {
  e.preventDefault();
  var form = e.target;
  clearErrors(form);
  var select = $("#rs-item_id"), qty = $("#rs-quantity");
  if (!select.value) { setError(select, "Choose which consumable you bought."); }
  if (!/^\d+$/.test(qty.value) || Number(qty.value) < 1) { setError(qty, "Enter how many you added, 1 or more."); }
  if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

  var row = $("#items-table tr[data-item-id='" + select.value + "']");
  var wasLow = isLow(row);
  row.setAttribute("data-available", num(row, "available") + Number(qty.value));
  renderItem(row);
  fillRestockSelect();
  var note = wasLow && !isLow(row) ? " It's no longer low stock." : (isLow(row) ? " Still at or below the reorder level." : "");
  showMsg($("#items-msg"), "<p>Restocked " + esc(row.getAttribute("data-name")) + ": +" + qty.value + ", now " + row.getAttribute("data-available") + " available." + note + "</p>", "ok", true);
  qty.value = "";
  $("#rs-notes").value = "";
}

var editingRow = null;
var nextItemId = 13;

function startEdit(row) {
  editingRow = row;
  $("#item-form-title").textContent = "Edit item #" + row.getAttribute("data-item-id");
  $("#item-submit").textContent = "Save changes";
  $("#item-cancel").hidden = false;
  $("#it-name").value = row.getAttribute("data-name");
  $("#it-category_id").value = row.getAttribute("data-category");
  $all("input[name='item_type']").forEach(function (r) {
    r.checked = r.value === row.getAttribute("data-type");
    r.disabled = true;   // changing type would break past request lines
  });
  $("#it-quantity_total").value = row.getAttribute("data-total");
  $("#it-reorder_level").value = row.getAttribute("data-reorder");
  $("#it-is_active").checked = row.getAttribute("data-active") === "1";
  clearErrors($("#item-form"));
  $("#item-form").scrollIntoView({ block: "start" });
  $("#it-name").focus();
}

function resetItemForm() {
  editingRow = null;
  $("#item-form").reset();
  clearErrors($("#item-form"));
  $all("input[name='item_type']").forEach(function (r) { r.disabled = false; });
  $("#item-form-title").textContent = "Add an item";
  $("#item-submit").textContent = "Add item";
  $("#item-cancel").hidden = true;
}

// PHP: INSERT INTO item ... or UPDATE item SET ... WHERE item_id = ?
function saveItem(e) {
  e.preventDefault();
  var form = e.target;
  clearErrors(form);
  var name = $("#it-name"), cat = $("#it-category_id"), total = $("#it-quantity_total"), reorder = $("#it-reorder_level");
  var type = $("input[name='item_type']:checked").value;
  var clash = itemRows().filter(function (r) { return r !== editingRow && r.getAttribute("data-name").toLowerCase() === name.value.trim().toLowerCase(); });

  if (!name.value.trim()) { setError(name, "Enter the item name."); }
  else if (clash.length) { setError(name, "There's already an item called " + clash[0].getAttribute("data-name") + ". Names are unique."); }
  if (!cat.value) { setError(cat, "Choose a category."); }
  if (!/^\d+$/.test(total.value)) { setError(total, "Enter a whole number, 0 or more."); }
  else if (editingRow && type === "tool" && Number(total.value) < num(editingRow, "total") - num(editingRow, "available")) {
    setError(total, (num(editingRow, "total") - num(editingRow, "available")) + " are out on loan, so quantity_total can't be lower than that.");
  }
  if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

  var row = editingRow;
  var verb = row ? "Saved" : "Added";
  if (!row) {
    row = document.createElement("tr");
    row.setAttribute("data-item-id", nextItemId++);
    row.setAttribute("data-type", type);
    row.setAttribute("data-total", "0");
    row.setAttribute("data-available", "0");
    row.innerHTML = "<td data-label='item_id'>" + row.getAttribute("data-item-id") + "</td><td class='cell-main'></td><td data-label='item_type'>" + type + "</td>" +
      "<td data-label='quantity_total' class='num'></td><td data-label='quantity_available' class='stock'></td><td data-label='reorder_level' class='num'></td><td data-label='Stock' class='state'></td>" +
      "<td class='actions'><button class='btn btn-small' type='button' data-edit>Edit</button></td>";
    $("#items-table tbody").insertBefore(row, $("#items-empty"));
  }
  // Available moves with the total: tools = total - out, consumables keep their issued/restocked history
  var change = Number(total.value) - num(row, "total");
  row.setAttribute("data-available", num(row, "available") + change);
  row.setAttribute("data-total", total.value);
  row.setAttribute("data-name", name.value.trim());
  row.setAttribute("data-category", cat.value);
  row.setAttribute("data-reorder", reorder.value);
  row.setAttribute("data-active", $("#it-is_active").checked ? "1" : "0");
  $(".cell-main", row).innerHTML = esc(name.value.trim()) + "<span class='sub'>" + esc(cat.selectedOptions[0].textContent) + "</span>";
  $("[data-label='quantity_total']", row).textContent = total.value;
  $("[data-label='reorder_level']", row).innerHTML = reorder.value === "" ? "<span class='muted'>None</span>" : esc(reorder.value);
  $("[data-edit]", row).innerHTML = "Edit<span class='visually-hidden'> " + esc(name.value.trim()) + "</span>";
  renderItem(row);
  fillRestockSelect();
  showMsg($("#items-msg"), "<p>" + verb + " " + esc(name.value.trim()) + ".</p>", "ok", true);
  resetItemForm();
}

// ---------- Requests: approve, reject, return, new ----------

var stock = {};   // item_id -> { name, type, total, available, li }, from #stock-list (v_item_stock)
var nextRequestId = 1046;

function setupRequests() {
  var list = $("#pending-list");
  if (!list) { return; }
  $all("#stock-list li").forEach(function (li) {
    stock[li.getAttribute("data-item-id")] = {
      name: li.getAttribute("data-name"), type: li.getAttribute("data-type"),
      total: Number(li.getAttribute("data-total")), available: Number(li.getAttribute("data-available")), li: li
    };
  });
  renderStockList();
  refreshSlips();
  list.addEventListener("click", onSlipClick);
  $("#loans-table").addEventListener("click", function (e) {
    var button = e.target.closest("[data-return]");
    if (!button) { return; }
    // Two taps, so a stray tap on a phone doesn't put a tool back on the wall
    if (button.getAttribute("data-armed")) { markReturned(button.closest("tr")); return; }
    button.setAttribute("data-armed", "1");
    button.classList.add("btn-primary");
    button.firstChild.textContent = "Tap again to confirm";
  });
  $("#add-line").addEventListener("click", function () { addLine(true); });
  $("#req-lines").addEventListener("change", onLineChange);
  $("#req-lines").addEventListener("click", function (e) {
    var remove = e.target.closest("[data-remove-line]");
    if (remove) { remove.closest(".req-line").remove(); $("#add-line").focus(); }
  });
  $("#new-request").addEventListener("submit", sendRequest);
  addLine(false);
}

function renderStockList() {
  Object.keys(stock).forEach(function (id) {
    var s = stock[id], visual = "";
    if (s.type === "tool") {
      for (var i = 0; i < s.total; i++) { visual += i < s.available ? "<li class='slot'></li>" : "<li class='slot out'></li>"; }
      visual = "<ul class='slots slots-small' aria-hidden='true'>" + visual + "</ul>";
    }
    var text = s.type === "tool" ? s.available + " of " + s.total + " on the wall" : s.available + " left";
    s.li.innerHTML = "<div><strong>" + esc(s.name) + "</strong><p>" + text + "</p></div>" + visual;
  });
}

// Mark every pending line that asks for more than quantity_available
function refreshSlips() {
  $all("#pending-list .slip").forEach(function (slip) {
    var blocked = false;
    $all(".lines li", slip).forEach(function (line) {
      var s = stock[line.getAttribute("data-item-id")], qty = Number(line.getAttribute("data-qty"));
      var span = $(".avail", line);
      if (qty > s.available) {
        blocked = true;
        span.innerHTML = "<span class='status status-alert'><span class='glyph' aria-hidden='true'>!</span>Only " + s.available + " available</span>";
      } else {
        span.innerHTML = "<span class='hint'>" + s.available + " available</span>";
      }
    });
    slip.classList.toggle("is-blocked", blocked);
  });
  var count = $all("#pending-list .slip").length;
  $("#pending-count").textContent = count;
  $("#pending-empty").hidden = count > 0;
}

function slipLines(slip) {
  return $all(".lines li", slip).map(function (line) {
    return { item: line.getAttribute("data-item-id"), qty: Number(line.getAttribute("data-qty")), due: line.getAttribute("data-due") };
  });
}

function onSlipClick(e) {
  var button = e.target.closest("[data-action]");
  if (!button) { return; }
  var slip = button.closest(".slip"), action = button.getAttribute("data-action");
  if (action === "approve") { askApprove(slip); }
  if (action === "reject") { askReject(slip); }
  if (action === "cancel") { closeConfirm(slip); $("[data-action='approve']", slip).focus(); }
  if (action === "confirm-approve") { approve(slip); }
  if (action === "confirm-reject") { reject(slip); }
}

// The stock check the database doesn't do: refuse if any line needs more than is available
function stockProblem(slip) {
  var short = slipLines(slip).filter(function (l) { return l.qty > stock[l.item].available; })[0];
  if (!short) { return ""; }
  var s = stock[short.item];
  return "<p><strong>Can't approve #" + slip.getAttribute("data-request-id") + ".</strong> It asks for " + short.qty + " " + esc(s.name) +
    ", but only " + s.available + " " + (s.type === "tool" ? "on the wall" : "left in stock") + " (quantity_available). " +
    (s.type === "tool" ? "Wait until one is returned, or reject it." : "Restock first, or reject it and ask for " + s.available + " or fewer.") + "</p>";
}

function openConfirm(slip, html) {
  closeConfirm(slip);
  $(".slip-note", slip).hidden = true;
  $(".decide-row", slip).hidden = true;
  var box = document.createElement("div");
  box.className = "confirm";
  box.innerHTML = html;
  slip.appendChild(box);
  var focusTarget = $("textarea", box) || $("p", box);
  focusTarget.setAttribute("tabindex", focusTarget.tagName === "P" ? "-1" : "0");
  focusTarget.focus();
}

function closeConfirm(slip) {
  var box = $(".confirm", slip);
  if (box) { box.remove(); }
  var row = $(".decide-row", slip);
  if (row) { row.hidden = false; }
}

// past = true gives "lent ... and issued ..." for the confirmation message
function describeLines(slip, past) {
  return slipLines(slip).map(function (l) {
    var s = stock[l.item];
    return s.type === "tool" ? (past ? "lent " : "lend ") + l.qty + " " + esc(s.name) + " until " + shortDate(l.due) : (past ? "issued " : "issue ") + l.qty + " " + esc(s.name);
  }).join(" and ");
}

function askApprove(slip) {
  var problem = stockProblem(slip);
  var note = $(".slip-note", slip);
  if (problem) { closeConfirm(slip); showMsg(note, problem, "alert", true); return; }
  openConfirm(slip, "<p>Approve #" + slip.getAttribute("data-request-id") + " for " + esc(slip.getAttribute("data-who")) + "? This will " + describeLines(slip) + ".</p>" +
    "<div class='btn-row'><button class='btn btn-primary' type='button' data-action='confirm-approve'>Yes, approve</button><button class='btn' type='button' data-action='cancel'>Cancel</button></div>");
}

function askReject(slip) {
  var id = slip.getAttribute("data-request-id");
  openConfirm(slip, "<div class='field'><label for='remarks-" + id + "'>Reason for rejecting (remarks)</label>" +
    "<textarea id='remarks-" + id + "' rows='2' aria-describedby='remarks-" + id + "-hint remarks-" + id + "-error'></textarea>" +
    "<span class='hint' id='remarks-" + id + "-hint'>The member sees this.</span><span class='error' id='remarks-" + id + "-error' hidden></span></div>" +
    "<div class='btn-row'><button class='btn btn-primary' type='button' data-action='confirm-reject'>Yes, reject</button><button class='btn' type='button' data-action='cancel'>Cancel</button></div>");
}

// PHP, in one transaction: re-check v_item_stock, then
// UPDATE item_request SET status = 'approved', decided_by = ?, decided_at = NOW() WHERE request_id = ?
function approve(slip) {
  var problem = stockProblem(slip);   // stock may have changed since the confirm opened
  if (problem) { closeConfirm(slip); showMsg($(".slip-note", slip), problem, "alert", true); return; }
  var id = slip.getAttribute("data-request-id"), who = slip.getAttribute("data-who");
  var lines = slipLines(slip), hasTool = false, summary = describeLines(slip, true);
  lines.forEach(function (l) {
    var s = stock[l.item];
    s.available -= l.qty;
    if (s.type === "tool") { hasTool = true; addLoanRow(id, who, l); }
  });
  var status = hasTool ? "approved" : "completed";   // consumable-only requests are done once issued
  addDecidedRow(id, who, status, hasTool ? "" : "Issued at the counter");
  slip.remove();
  renderStockList();
  refreshSlips();
  var left = lines.map(function (l) { return esc(stock[l.item].name) + ": " + stock[l.item].available + " left"; }).join(", ");
  showMsg($("#requests-msg"), "<p><strong>Approved #" + id + " for " + esc(who) + ":</strong> " + summary + ". Now " + left + ".</p>", "ok", true);
}

function reject(slip) {
  var box = $(".confirm", slip), remarks = $("textarea", box);
  clearErrors(box);
  if (!remarks.value.trim()) { setError(remarks, "Add a short reason so the member knows why."); remarks.focus(); return; }
  var id = slip.getAttribute("data-request-id"), who = slip.getAttribute("data-who");
  addDecidedRow(id, who, "rejected", remarks.value.trim());
  slip.remove();
  refreshSlips();
  showMsg($("#requests-msg"), "<p><strong>Rejected #" + id + " for " + esc(who) + ".</strong> Stock is unchanged.</p>", "ok", true);
}

function addLoanRow(id, who, line) {
  var s = stock[line.item];
  var row = document.createElement("tr");
  row.setAttribute("data-request-id", id);
  row.setAttribute("data-item-id", line.item);
  row.setAttribute("data-qty", line.qty);
  row.innerHTML = "<td data-label='request_id'>" + id + "</td><td class='cell-main'>" + esc(who) + "</td><td data-label='item_name'>" + esc(s.name) + "</td>" +
    "<td data-label='quantity' class='num'>" + line.qty + "</td><td data-label='borrowed_at'>" + shortDate(TODAY) + "</td><td data-label='due_date'>" + shortDate(line.due) + "</td>" +
    "<td data-label='Status'><span class='status status-wait'><span class='glyph' aria-hidden='true'>&#9675;</span>Due " + shortDate(line.due) + "</span></td>" +
    "<td class='actions'><button class='btn btn-small' type='button' data-return>Mark returned<span class='visually-hidden'> " + esc(s.name) + ", " + esc(who) + "</span></button></td>";
  $("#loans-table tbody").insertBefore(row, $("#loans-empty"));
  $("#loans-empty").hidden = true;
}

function addDecidedRow(id, who, status, remarks) {
  var glyph = status === "rejected" ? "&#10005;" : "&#10003;";
  var cls = status === "rejected" ? "status-off" : "status-ok";
  var row = document.createElement("tr");
  row.innerHTML = "<td data-label='request_id'>" + id + "</td><td class='cell-main'>" + esc(who) + "</td>" +
    "<td data-label='status'><span class='status " + cls + "'><span class='glyph' aria-hidden='true'>" + glyph + "</span>" + status + "</span></td>" +
    "<td data-label='decided_by'>Paolo Santos</td><td data-label='remarks'>" + esc(remarks) + "</td>";
  var body = $("#decided-table tbody");
  body.insertBefore(row, body.firstChild);
}

// PHP: UPDATE request_line SET returned_at = NOW() WHERE line_id = ?
// and when no tool line of the request is still out: UPDATE item_request SET status = 'completed'
function markReturned(row) {
  var id = row.getAttribute("data-request-id"), s = stock[row.getAttribute("data-item-id")], qty = Number(row.getAttribute("data-qty"));
  var who = $(".cell-main", row).firstChild.textContent;
  s.available += qty;
  row.remove();
  var stillOut = $all("#loans-table tr[data-request-id='" + id + "']").length;
  $("#loans-empty").hidden = $all("#loans-table tr[data-request-id]").length > 0;
  if (!stillOut) { addDecidedRow(id, who, "completed", "All tools returned"); }
  renderStockList();
  refreshSlips();
  showMsg($("#requests-msg"), "<p><strong>Returned: " + qty + " " + esc(s.name) + " from " + esc(who) + ".</strong> " + s.available + " of " + s.total + " on the wall now." +
    (stillOut ? "" : " Request #" + id + " is completed.") + "</p>", "ok", true);
}

// New request lines: one <div class="req-line"> per request_line row
var lineCounter = 0;

function addLine(focusIt) {
  lineCounter++;
  var n = lineCounter;
  var line = $("#line-template").content.firstElementChild.cloneNode(true);
  var select = $("select", line), qty = $("input[name='quantity']", line), due = $("input[name='due_date']", line);
  var labels = $all("label", line);
  [select, qty, due].forEach(function (field, i) {
    field.id = field.name + "-" + n;
    labels[i].setAttribute("for", field.id);
  });
  var hint = $(".hint", line);
  hint.id = "due_date-" + n + "-hint";
  due.setAttribute("aria-describedby", hint.id);
  var options = "<option value=''>Choose an item</option><optgroup label='Tools (come back by the due date)'>";
  var consumables = "<optgroup label='Consumables (not returned)'>";
  Object.keys(stock).forEach(function (id) {
    var s = stock[id], opt = "<option value='" + id + "'>" + esc(s.name) + ", " + s.available + " available</option>";
    if (s.type === "tool") { options += opt; } else { consumables += opt; }
  });
  select.innerHTML = options + "</optgroup>" + consumables + "</optgroup>";
  var error = document.createElement("p");
  error.className = "error line-error";
  error.hidden = true;
  error.id = "line-" + n + "-error";
  select.setAttribute("aria-describedby", error.id);
  line.appendChild(error);
  if ($all("#req-lines .req-line").length > 0) {
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-quiet btn-small";
    remove.setAttribute("data-remove-line", "");
    remove.innerHTML = "Remove this item";
    line.appendChild(remove);
  }
  $("#req-lines").appendChild(line);
  if (focusIt) { select.focus(); }
}

// Consumables have no due date (trg_line_consumable_ins), so the field turns off
function onLineChange(e) {
  if (e.target.name !== "item_id") { return; }
  var line = e.target.closest(".req-line"), due = $("input[name='due_date']", line), hint = $(".hint", line);
  var s = stock[e.target.value];
  var consumable = s && s.type === "consumable";
  due.disabled = consumable;
  if (consumable) { due.value = ""; }
  hint.textContent = consumable ? "No due date: consumables aren't returned" : "Required for tools";
}

function sendRequest(e) {
  e.preventDefault();
  var form = e.target;
  clearErrors(form);
  var member = $("#requested_by");
  if (!member.value) { setError(member, "Choose who is borrowing."); }
  var seen = {}, lines = [], warnings = [];
  $all("#req-lines .req-line").forEach(function (line) {
    var select = $("select", line), qty = $("input[name='quantity']", line), due = $("input[name='due_date']", line), error = $(".line-error", line);
    var problem = "";
    var s = stock[select.value];
    if (!s) { problem = "Choose an item, or remove this line."; select.setAttribute("aria-invalid", "true"); }
    else if (seen[select.value]) { problem = s.name + " is already on this request. Change that line's quantity instead."; select.setAttribute("aria-invalid", "true"); }
    else if (!/^\d+$/.test(qty.value) || Number(qty.value) < 1) { problem = "Quantity must be 1 or more."; qty.setAttribute("aria-invalid", "true"); }
    else if (s.type === "tool" && !due.value) { problem = "Tools need a due date."; due.setAttribute("aria-invalid", "true"); }
    else if (s.type === "tool" && due.value < TODAY) { problem = "The due date can't be in the past."; due.setAttribute("aria-invalid", "true"); }
    if (problem) { error.textContent = problem; error.hidden = false; return; }
    seen[select.value] = true;
    if (Number(qty.value) > s.available) { warnings.push("only " + s.available + " " + s.name + " available"); }
    lines.push({ item: select.value, qty: Number(qty.value), due: s.type === "tool" ? due.value : "" });
  });
  if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

  var id = nextRequestId++;
  var own = member.value === "2";   // the signed-in officer
  var who = member.selectedOptions[0].textContent.replace(" (you)", "");
  var html = "<div class='slip-top'><h3>#" + id + " " + esc(who) + (own ? " (you)" : "") + "</h3><p>requested_at " + shortDate(TODAY) + ", " + nowTime() + "</p></div><ul class='lines'>";
  lines.forEach(function (l) {
    var s = stock[l.item];
    html += "<li data-item-id='" + l.item + "' data-qty='" + l.qty + "' data-due='" + l.due + "'><span>" + esc(s.name) + " x" + l.qty + ", " + s.type +
      (s.type === "tool" ? ", due " + shortDate(l.due) : ", no due date") + "</span><span class='avail'></span></li>";
  });
  html += "</ul>";
  html += own
    ? "<p class='status status-wait'><span class='glyph' aria-hidden='true'>&#9675;</span>Your own request. Another officer, the President or the Adviser decides it.</p>"
    : "<div class='slip-note msg msg-alert' role='alert' tabindex='-1' hidden></div><div class='btn-row decide-row'><button class='btn btn-primary' type='button' data-action='approve'>Approve<span class='visually-hidden'> request " + id + "</span></button><button class='btn' type='button' data-action='reject'>Reject<span class='visually-hidden'> request " + id + "</span></button></div>";
  var slip = document.createElement("article");
  slip.className = "slip";
  slip.setAttribute("data-request-id", id);
  slip.setAttribute("data-who", who);
  slip.innerHTML = html;
  $("#pending-list").insertBefore(slip, $("#pending-list").firstChild);
  refreshSlips();

  showMsg($("#new-request-msg"), "<p><strong>Sent #" + id + " for " + esc(who) + ".</strong> It's at the top of Pending." +
    (warnings.length ? " Heads up: " + esc(warnings.join(", ")) + ", so it can't be approved until stock comes back." : "") + "</p>", warnings.length ? "alert" : "ok", true);
  form.reset();
  $("#req-lines").innerHTML = "";
  addLine(false);
}

// ---------- Settings ----------

function setupSettings() {
  var roles = $("#roles-table");
  if (!roles) { return; }
  roles.addEventListener("change", function (e) {
    var box = e.target;
    $(".can-text", box.closest("label")).textContent = box.checked ? "Yes, can approve" : "No, can request only";
    showMsg($("#settings-msg"), "<p>" + esc(box.getAttribute("data-role")) + " can_approve is now " + (box.checked ? "1. Active members with this role can decide requests (never their own)." : "0. They can still make requests.") + "</p>", "ok");
  });
  $all(".lookup-form").forEach(function (form) { form.addEventListener("submit", addLookup); });
}

// PHP: INSERT INTO purpose (name) VALUES (?), same for category
function addLookup(e) {
  e.preventDefault();
  var form = e.target, input = $("input", form), thing = form.getAttribute("data-thing");
  var table = document.getElementById(form.getAttribute("data-table"));
  clearErrors(form);
  var value = input.value.trim();
  var names = $all("tbody .cell-main", table).map(function (td) { return td.textContent.toLowerCase(); });
  if (!value) { setError(input, "Type a name for the new " + thing + "."); input.focus(); return; }
  if (names.indexOf(value.toLowerCase()) !== -1) { setError(input, "That " + thing + " already exists. Names are unique."); input.focus(); return; }
  var row = document.createElement("tr");
  row.innerHTML = "<td data-label='" + thing + "_id'>" + (names.length + 1) + "</td><td class='cell-main'>" + esc(value) + "</td>";
  $("tbody", table).appendChild(row);
  input.value = "";
  showMsg($("#settings-msg"), "<p>Added the " + thing + " " + esc(value) + ".</p>", "ok");
}

// ---------- Start ----------

setupMenu();
setupKiosk();
setupAttendance();
setupPeople();
setupItems();
setupRequests();
setupSettings();
