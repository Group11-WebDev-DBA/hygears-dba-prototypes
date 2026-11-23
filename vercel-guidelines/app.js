/* =========================================================
   Hygears HQ System - shared script for all 8 pages.
   Plain functions, no libraries. Each page section runs only
   when <body data-page="..."> matches. All data is SAMPLE data;
   the PHP rebuild replaces the arrays below with SQL queries.
   ========================================================= */

/* ---------- Small helpers ---------- */
function $(selector, root) { return (root || document).querySelector(selector); }
function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

var LOCALE = (navigator.languages && navigator.languages[0]) || "en-PH";
var fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" });
var fmtDate = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
var fmtDateTime = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
var fmtLong = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
var fmtShortDay = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" });

// "2026-11-23" or "2026-11-23T09:05" read as LOCAL time (new Date("2026-11-23") would be UTC)
function parseLocal(text) {
  var p = text.split(/[-T:]/).map(Number);
  return new Date(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0);
}

// Re-render every <time datetime="..." data-format="..."> in the reader’s locale
function formatTimes(root) {
  var formats = { time: fmtTime, date: fmtDate, datetime: fmtDateTime, long: fmtLong };
  $all("time[data-format]", root).forEach(function (el) {
    var f = formats[el.getAttribute("data-format")];
    if (f) el.textContent = f.format(parseLocal(el.getAttribute("datetime")));
  });
}

// Escape text before putting it into innerHTML (same job as htmlspecialchars in PHP)
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* ---------- Toast with optional Undo (announced by aria-live) ---------- */
function toast(message, undo) {
  var region = $("#toast-region");
  if (!region) return;
  region.innerHTML = "";
  var box = document.createElement("div");
  box.className = "toast";
  box.innerHTML = "<p>" + esc(message) + "</p>";
  if (undo) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Undo";
    btn.addEventListener("click", function () { undo(); box.remove(); });
    box.appendChild(btn);
  }
  region.appendChild(box);
  setTimeout(function () { box.remove(); }, undo ? 7000 : 5000);
}

/* ---------- Inline form errors ---------- */
function showError(input, errEl, message) {
  if (message) errEl.textContent = message;
  errEl.hidden = false;
  if (!errEl.id) errEl.id = "err-" + Math.random().toString(36).slice(2, 8);
  if (input) {
    input.setAttribute("aria-invalid", "true");
    var ids = (input.getAttribute("aria-describedby") || "").split(" ");
    if (ids.indexOf(errEl.id) === -1) input.setAttribute("aria-describedby", (ids.join(" ") + " " + errEl.id).trim());
  }
}
function clearErrors(form) {
  $all(".error", form).forEach(function (e) { e.hidden = true; });
  $all("[aria-invalid]", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
}
// Move focus to the first field with an error
function focusFirstError(form) {
  var first = $("[aria-invalid='true']", form);
  if (first) first.focus();
}

/* ---------- Warn before leaving with unsaved form changes ---------- */
var dirtyForms = [];
function guardForms() {
  $all("form[data-guard]").forEach(function (form) {
    form.addEventListener("input", function () { if (dirtyForms.indexOf(form) === -1) dirtyForms.push(form); });
    form.addEventListener("reset", function () { markClean(form); });
  });
  window.addEventListener("beforeunload", function (e) {
    if (dirtyForms.length) { e.preventDefault(); e.returnValue = ""; }
  });
}
function markClean(form) { dirtyForms = dirtyForms.filter(function (f) { return f !== form; }); }

/* ---------- Mobile menu button ---------- */
function setupMenu() {
  var btn = $(".menu-btn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var open = $("#sidebar").classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  });
}

/* ---------- Table filters kept in the URL (?q=&purpose=...) ---------- */
// Rows carry data-* attributes named like the filter controls; "q" searches the row text.
function setupFilters(form) {
  var table = document.getElementById(form.getAttribute("data-filter-table"));
  var rows = $all("tbody tr:not(.empty-row)", table);
  var emptyRow = $(".empty-row", table);
  var countEl = document.getElementById(table.id.replace("-table", "-count"));
  var controls = $all("input[name], select[name]", form);

  // Load filters from the URL so a filtered view can be bookmarked or shared
  var params = new URLSearchParams(location.search);
  controls.forEach(function (c) {
    if (!params.has(c.name)) return;
    if (c.type === "checkbox") c.checked = params.get(c.name) === c.value;
    else c.value = params.get(c.name);
  });

  function apply() {
    rows = $all("tbody tr:not(.empty-row)", table); // rows may have been added
    var query = new URLSearchParams();
    var shown = 0;
    controls.forEach(function (c) {
      if (c.type === "checkbox" ? c.checked : c.value) query.set(c.name, c.type === "checkbox" ? c.value : c.value);
    });
    rows.forEach(function (row) {
      var ok = controls.every(function (c) {
        if (c.type === "checkbox") return !c.checked || row.getAttribute("data-" + c.name) === c.value;
        if (!c.value) return true;
        if (c.name === "q") return row.textContent.toLowerCase().indexOf(c.value.trim().toLowerCase()) !== -1;
        return row.getAttribute("data-" + c.name) === c.value;
      });
      row.hidden = !ok;
      if (ok) shown++;
    });
    if (emptyRow) emptyRow.hidden = shown > 0;
    if (countEl) countEl.textContent = "Showing " + shown + " of " + rows.length + " " + countEl.getAttribute("data-noun");
    var qs = query.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  form.addEventListener("input", apply);
  form.addEventListener("change", apply);
  form.addEventListener("submit", function (e) { e.preventDefault(); apply(); });
  form.addEventListener("reset", function () { setTimeout(apply, 0); });
  apply();
  return apply;
}

/* =========================================================
   KIOSK (index.html)
   ========================================================= */
// person rows that have a student_id (members and PUP non-members)
var KIOSK_PEOPLE = [
  { id: 1, sid: "2023-00101-MN-0", name: "Mika Santos", tag: "Member" },
  { id: 2, sid: "2022-00214-MN-0", name: "Paolo Reyes", tag: "Officer" },
  { id: 3, sid: "2022-00187-MN-0", name: "Ana Lim", tag: "President" },
  { id: 4, sid: "2024-00342-MN-0", name: "Jun Bautista", tag: "Member" },
  { id: 5, sid: "2023-00456-MN-0", name: "Carla Mendoza", tag: "Member" },
  { id: 6, sid: "FAC-2019-0042", name: "Rafael Cruz", tag: "Adviser" }
];
// attendance rows with time_out IS NULL
var inside = [
  { id: 2, name: "Paolo Reyes", tag: "Officer", purpose: "Meeting", timeIn: parseLocal("2026-11-23T09:05") },
  { id: 7, name: "Lea Navarro", tag: "Visitor, TUP Manila", purpose: "Workshop", timeIn: parseLocal("2026-11-23T10:00") },
  { id: 3, name: "Ana Lim", tag: "President", purpose: "Meeting", timeIn: parseLocal("2026-11-23T10:15") },
  { id: 6, name: "Rafael Cruz", tag: "Adviser", purpose: "Workshop", timeIn: parseLocal("2026-11-23T10:30") }
];

// "2023 00101 mn 0" and "202300101MN0" both match "2023-00101-MN-0"
function normalizeId(text) { return text.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function findStudent(text) {
  var key = normalizeId(text);
  if (!key) return null;
  var exact = KIOSK_PEOPLE.filter(function (p) { return normalizeId(p.sid) === key; });
  if (exact.length) return exact[0];
  // Shortcut for one-handed use: the 5 middle digits ("00101"), only when exactly one person matches
  if (/^\d{5}$/.test(key)) {
    var serial = KIOSK_PEOPLE.filter(function (p) { return p.sid.split("-")[1] === key; });
    if (serial.length === 1) return serial[0];
  }
  return null;
}

function renderInside() {
  var list = $("#inside-list");
  list.innerHTML = "";
  inside.forEach(function (p, index) {
    var li = document.createElement("li");
    li.innerHTML =
      '<span class="who"><strong>' + esc(p.name) + "</strong>" +
      "<span>" + esc(p.tag) + " · " + esc(p.purpose) + " · since " + fmtTime.format(p.timeIn) + "</span></span>" +
      '<button class="btn" type="button" aria-label="Sign out ' + esc(p.name) + '">Sign Out</button>';
    $("button", li).addEventListener("click", function () { signOut(index); });
    list.appendChild(li);
  });
  $("#inside-count").textContent = "(" + inside.length + ")";
  $("#inside-empty").hidden = inside.length > 0;
}

// Sign out sets time_out = NOW(); Undo puts the row back
function signOut(index) {
  var person = inside.splice(index, 1)[0];
  renderInside();
  toast("Signed out " + person.name + " at " + fmtTime.format(new Date()) + ".", function () {
    inside.splice(index, 0, person);
    renderInside();
    toast(person.name + " is signed in again.");
  });
}

function setupKiosk() {
  var form = $("#signin-form");
  var sid = $("#k-sid");
  var resetTimer = null;

  function tick() {
    var now = new Date();
    $("#clock-time").textContent = fmtTime.format(now);
    $("#clock-date").textContent = fmtShortDay.format(now);
  }
  tick();
  setInterval(tick, 30000);
  renderInside();

  // Segmented PUP Student / Visitor switch
  $all("input[name='kind']", form).forEach(function (radio) {
    radio.addEventListener("change", function () {
      var visitor = form.kind.value === "visitor";
      $("#student-fields").hidden = visitor;
      $("#visitor-fields").hidden = !visitor;
      $all(".segmented label", form).forEach(function (l) { l.classList.toggle("is-on", $("input", l).checked); });
      clearErrors(form);
    });
  });

  // Purpose tiles show which one is picked
  $all("#purposes input", form).forEach(function (radio) {
    radio.addEventListener("change", function () {
      $all("#purposes label").forEach(function (l) { l.classList.toggle("is-on", $("input", l).checked); });
      $("#k-purpose-err").hidden = true;
    });
  });

  // Live match while typing the student number, so the person sees their own name
  sid.addEventListener("input", function () {
    var p = findStudent(sid.value);
    $("#k-sid-match").textContent = p ? "✓ " + p.name + ", " + p.tag : "";
    $("#k-sid-err").hidden = true;
    sid.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var visitor = form.kind.value === "visitor";
    var person = null;

    if (!visitor) {
      person = findStudent(sid.value);
      if (!sid.value.trim()) {
        showError(sid, $("#k-sid-err"), "Enter your student number.");
      } else if (!person) {
        showError(sid, $("#k-sid-err"), "No one has student number " + sid.value.trim() + " yet. Check the number, or ask an officer to add you. Not from PUP? Tap Visitor.");
      } else {
        var already = inside.filter(function (i) { return i.id === person.id; })[0];
        if (already) showError(sid, $("#k-sid-err"), person.name + " is already signed in since " + fmtTime.format(already.timeIn) + ". Sign out below first.");
      }
    } else {
      ["first", "last", "contact", "aff"].forEach(function (key) {
        var input = $("#k-" + key);
        if (!input.value.trim()) showError(input, $("#k-" + key + "-err"));
      });
      person = { id: Date.now(), name: $("#k-first").value.trim() + " " + $("#k-last").value.trim(), tag: "Visitor, " + $("#k-aff").value.trim() };
    }

    var purposeInput = $("input[name='purpose_id']:checked", form);
    var purposeName = purposeInput ? purposeInput.parentNode.textContent.trim() : "";
    if (!purposeInput) showError(null, $("#k-purpose-err"));
    if ($("[aria-invalid='true']", form) || !$("#k-purpose-err").hidden) {
      if ($("[aria-invalid='true']", form)) focusFirstError(form);
      else $("#purposes input").focus();
      return;
    }

    // INSERT INTO attendance (person_id, purpose_id) VALUES (?, ?) -- time_in defaults to NOW()
    var now = new Date();
    inside.push({ id: person.id, name: person.name, tag: person.tag, purpose: purposeName, timeIn: now });
    renderInside();

    $("#done-text").innerHTML = "<strong>" + esc(person.name) + "</strong><br>" + esc(purposeName) + " · " + fmtTime.format(now);
    $("#signin-step").hidden = true;
    $("#done-step").hidden = false;
    $("#done-title").focus();
    resetTimer = setTimeout(nextPerson, 8000);
  });

  // Back to an empty form for the next person in line
  function nextPerson() {
    clearTimeout(resetTimer);
    form.reset();
    form.kind[0].dispatchEvent(new Event("change"));
    $all("#purposes label").forEach(function (l) { l.classList.remove("is-on"); });
    $("#k-sid-match").textContent = "";
    $("#done-step").hidden = true;
    $("#signin-step").hidden = false;
    $("#signin-h").focus();
  }
  $("#next-person").addEventListener("click", nextPerson);
}

/* =========================================================
   ATTENDANCE
   ========================================================= */
function setupAttendance() {
  $("#export-btn").addEventListener("click", function () {
    toast("Export is a stub here. The PHP version downloads the filtered rows as a .csv file.");
  });
}

/* =========================================================
   PEOPLE
   ========================================================= */
function setupPeople(applyFilters) {
  var form = $("#person-form");
  var memberBox = $("#p-is-member");
  var sidInput = $("#p-sid");

  // Active / inactive toggle with Undo
  function bindToggle(btn) {
    btn.addEventListener("click", function () { toggleActive(btn, true); });
  }
  function toggleActive(btn, offerUndo) {
    var row = btn.closest("tr");
    var name = $("strong", row).textContent.split(", ").reverse().join(" ");
    var nowActive = row.classList.contains("row-muted");
    row.classList.toggle("row-muted", !nowActive);
    $("[data-label='Status']", row).innerHTML = nowActive
      ? '<span class="status"><span class="ico" aria-hidden="true">✓</span>Active</span>'
      : '<span class="status done"><span class="ico" aria-hidden="true">–</span>Inactive</span>';
    btn.textContent = nowActive ? "Mark Inactive" : "Mark Active";
    btn.setAttribute("aria-label", (nowActive ? "Mark " + name + " inactive" : "Mark " + name + " active"));
    if (offerUndo) toast(name + " is now " + (nowActive ? "active." : "inactive. Inactive members can’t request or approve."), function () { toggleActive(btn, false); });
  }
  $all("[data-toggle-active]").forEach(bindToggle);

  // Members need a student_id (trg_member_requires_student_id_ins)
  memberBox.addEventListener("change", function () {
    $("#p-member-err").hidden = true;
    if (memberBox.checked && !sidInput.value.trim()) {
      memberBox.checked = false;
      showError(null, $("#p-member-err"));
      sidInput.focus();
      return;
    }
    $("#member-fields").hidden = !memberBox.checked;
  });
  form.addEventListener("reset", function () { $("#member-fields").hidden = true; clearErrors(form); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    if (!form.first_name.value.trim()) showError(form.first_name, $("#p-first-err"));
    if (!form.last_name.value.trim()) showError(form.last_name, $("#p-last-err"));
    if (!form.contact_number.value.trim()) showError(form.contact_number, $("#p-contact-err"));
    var sid = sidInput.value.trim().toUpperCase();
    var used = $all("#people-table td[data-label='Student ID']").some(function (td) { return td.textContent.trim() === sid; });
    if (sid && used) showError(sidInput, $("#p-sid-err"));
    if (memberBox.checked && !sid) showError(sidInput, $("#p-member-err"));
    if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

    var member = memberBox.checked;
    var roleName = form.role_id.options[form.role_id.selectedIndex].text.replace(" (can approve)", "");
    var tbody = $("#people-table tbody");
    var nextId = $all("#people-table tbody tr:not(.empty-row)").length + 1;
    var tr = document.createElement("tr");
    tr.setAttribute("data-who", member ? "member" : "visitor");
    tr.innerHTML =
      '<td data-label="#" class="num">' + nextId + "</td>" +
      '<td data-label="Name"><strong>' + esc(form.last_name.value.trim()) + ", " + esc(form.first_name.value.trim()) + "</strong>" + (member && form.email.value ? '<span class="sub">' + esc(form.email.value) + "</span>" : "") + "</td>" +
      '<td data-label="Student ID" class="' + (sid ? "mono" : "muted") + '">' + (sid ? esc(sid) : "none (visitor)") + "</td>" +
      '<td data-label="Contact" class="num">' + esc(form.contact_number.value.trim()) + "</td>" +
      '<td data-label="Affiliation">' + (esc(form.affiliation.value.trim()) || '<span class="muted">—</span>') + "</td>" +
      '<td data-label="Role"' + (member ? ">" + esc(roleName) : ' class="muted">' + (sid ? "Not a member" : "Visitor")) + "</td>" +
      '<td data-label="Status">' + (member ? '<span class="status"><span class="ico" aria-hidden="true">✓</span>Active</span>' : '<span class="muted">—</span>') + "</td>" +
      '<td class="actions-cell">' + (member ? '<button class="btn btn-sm" type="button" data-toggle-active>Mark Inactive</button>' : "") + "</td>";
    tbody.insertBefore(tr, $(".empty-row", tbody));
    if (member) bindToggle($("button", tr));
    toast("Saved " + form.first_name.value.trim() + " " + form.last_name.value.trim() + (member ? " as " + roleName + "." : " as a person (not a member)."));
    markClean(form);
    form.reset();
    applyFilters();
  });
}

/* =========================================================
   ITEMS
   ========================================================= */
function setAvailable(row, available) {
  var reorder = parseInt(row.cells[6].textContent, 10);
  var low = !isNaN(reorder) && available <= reorder;
  row.setAttribute("data-low", low ? "yes" : "no");
  row.classList.toggle("row-alert", low);
  row.cells[5].innerHTML = low ? '<span class="status alert"><span class="ico" aria-hidden="true">!</span>' + available + " · Low</span>" : String(available);
}
function availableOf(row) { return parseInt(row.cells[5].textContent.match(/\d+/)[0], 10); }

function setupItems(applyFilters) {
  var form = $("#item-form");
  var restock = $("#restock-form");
  var editing = null; // the <tr> being edited, or null when adding

  function setMode(row) {
    editing = row;
    $("#item-h").textContent = row ? "Edit Item #" + row.cells[0].textContent : "Add Item";
    $("#item-sql").textContent = row ? "UPDATE item … WHERE item_id = " + row.cells[0].textContent : "INSERT INTO item …";
    $("#item-submit").textContent = row ? "Save Changes" : "Save Item";
  }

  // Edit fills the form from the row
  $("#items-table").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-edit]");
    if (!btn) return;
    var row = btn.closest("tr");
    form.reset();
    setMode(row);
    form.name.value = $("strong", row).textContent;
    $all("option", form.category_id).forEach(function (o) { o.selected = o.text === row.cells[2].textContent; });
    $all("input[name='item_type']", form).forEach(function (r) { r.checked = r.value === row.cells[3].textContent; });
    form.quantity_total.value = row.cells[4].textContent;
    form.reorder_level.value = parseInt(row.cells[6].textContent, 10) || "";
    form.is_active.checked = row.cells[7].textContent.indexOf("Inactive") === -1;
    $("#item-h").scrollIntoView({ block: "start" });
    form.name.focus({ preventScroll: true });
  });
  form.addEventListener("reset", function () { clearErrors(form); setMode(null); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var name = form.name.value.trim();
    if (!name) showError(form.name, $("#i-name-err"), "Enter an item name.");
    var clash = $all("#items-table tbody tr:not(.empty-row)").some(function (r) {
      return r !== editing && $("strong", r).textContent.toLowerCase() === name.toLowerCase();
    });
    if (name && clash) showError(form.name, $("#i-name-err"), "An item called " + name + " already exists (uq_item_name). Edit that one instead.");
    if (!form.category_id.value) showError(form.category_id, $("#i-cat-err"));
    var type = form.item_type.value;
    if (!type) showError(form.item_type[0], $("#i-type-err"));
    var total = parseInt(form.quantity_total.value, 10);
    if (isNaN(total) || total < 0) showError(form.quantity_total, $("#i-total-err"));
    if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

    var cat = form.category_id.options[form.category_id.selectedIndex].text;
    var reorder = form.reorder_level.value === "" ? null : parseInt(form.reorder_level.value, 10);
    var row = editing;
    if (!row) {
      row = document.createElement("tr");
      var id = $all("#items-table tbody tr:not(.empty-row)").length + 1;
      row.innerHTML =
        '<td data-label="#" class="num">' + id + '</td><td data-label="Item"><strong></strong></td><td data-label="Category"></td><td data-label="Type"></td>' +
        '<td data-label="Total" class="num"></td><td data-label="Available" class="num"></td><td data-label="Reorder at" class="num"></td>' +
        '<td data-label="Status"></td><td class="actions-cell"><button class="btn btn-sm" type="button" data-edit>Edit</button></td>';
      $("#items-table tbody").insertBefore(row, $("#items-table .empty-row"));
    }
    var oldTotal = editing ? parseInt(row.cells[4].textContent, 10) : 0;
    var oldAvail = editing ? availableOf(row) : 0;
    $("strong", row).textContent = name;
    $("[data-edit]", row).setAttribute("aria-label", "Edit " + name);
    row.cells[2].textContent = cat;
    row.cells[3].textContent = type;
    row.cells[4].textContent = total;
    row.cells[6].textContent = reorder === null ? "—" : reorder;
    row.cells[6].className = "num" + (reorder === null ? " muted" : "");
    row.cells[7].innerHTML = form.is_active.checked
      ? '<span class="status"><span class="ico" aria-hidden="true">✓</span>Active</span>'
      : '<span class="status done"><span class="ico" aria-hidden="true">–</span>Inactive</span>';
    row.setAttribute("data-category", cat);
    row.setAttribute("data-type", type);
    // Available = old available + change in quantity_total (what v_item_stock would recalculate)
    setAvailable(row, oldAvail + (total - oldTotal));

    // A new consumable can be restocked straight away
    if (!editing && type === "consumable") {
      restock.item_id.add(new Option(name + " (" + availableOf(row) + " left)", row.cells[0].textContent));
    }
    toast((editing ? "Saved changes to " : "Added ") + name + ".");
    markClean(form);
    form.reset();
    applyFilters();
  });

  // Restock adds to quantity_available through v_item_stock
  restock.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(restock);
    if (!restock.item_id.value) showError(restock.item_id, $("#r-item-err"));
    var qty = parseInt(restock.quantity.value, 10);
    if (isNaN(qty) || qty < 1) showError(restock.quantity, $("#r-qty-err"));
    if (!restock.restocked_on.value) showError(restock.restocked_on, $("#r-date-err"));
    if ($("[aria-invalid='true']", restock)) { focusFirstError(restock); return; }

    var id = restock.item_id.value;
    var row = $all("#items-table tbody tr").filter(function (r) { return r.cells[0].textContent === id; })[0];
    var before = availableOf(row);
    var name = $("strong", row).textContent;
    setAvailable(row, before + qty);
    var opt = restock.item_id.options[restock.item_id.selectedIndex];
    opt.text = name + " (" + (before + qty) + " left" + (row.getAttribute("data-low") === "yes" ? ", low)" : ")");
    toast("Restocked " + name + ": " + before + " → " + (before + qty) + " available.");
    markClean(restock);
    restock.reset();
    applyFilters();
  });
}

/* =========================================================
   REQUESTS
   ========================================================= */
var CURRENT_USER = 2; // Paolo Reyes, Officer (role can_approve = 1)
// v_item_stock.quantity_available (sample) and item_type
var stock = { 1: 1, 2: 1, 3: 3, 4: 2, 5: 1, 6: 0, 7: 1, 8: 3, 9: 5, 10: 4, 11: 9, 12: 11 };
var ITEM_NAMES = { 1: "Cordless drill", 2: "Digital multimeter", 3: "Soldering iron 60 W", 4: "Vernier caliper", 5: "Socket wrench set", 6: "Angle grinder", 7: "Oscilloscope", 8: "Solder wire 0.8 mm", 9: "Flux paste", 10: "Cutting disc 4 in", 11: "Heat-shrink tubing pack", 12: "Hacksaw blade" };
// shortcut: sample ids 1-7 are tools; the PHP version reads item.item_type instead
function isTool(itemId) { return Number(itemId) <= 7; }

// Why a pending request can’t be approved right now (empty list = OK)
function approvalProblems(row) {
  var problems = [];
  if (Number(row.getAttribute("data-requested-by")) === CURRENT_USER) {
    problems.push("This is your own request. Another officer, the President or the Adviser has to decide it (chk_request_not_self).");
  }
  $all("li[data-item-id]", row).forEach(function (li) {
    var id = li.getAttribute("data-item-id");
    var qty = Number(li.getAttribute("data-qty"));
    if (qty > stock[id]) {
      problems.push("Not enough stock: " + ITEM_NAMES[id] + " asks for " + qty + ", only " + stock[id] + " available. Reject with a reason, or wait for a return.");
    }
  });
  return problems;
}

// Re-check every pending row and show the reason next to its items
function checkPending() {
  var rows = $all("#pending-table tbody tr[data-request]:not(.decided)");
  rows.forEach(function (row) {
    var problems = approvalProblems(row);
    var own = Number(row.getAttribute("data-requested-by")) === CURRENT_USER;
    var approve = $("[data-approve]", row);
    var reject = $("[data-reject]", row);
    var old = $(".block-msg", row);
    if (old) old.remove();
    var msgId = "block-" + row.getAttribute("data-request");
    if (problems.length) {
      var li = document.createElement("li");
      var stockShort = problems.length > (own ? 1 : 0);
      li.className = "block-msg " + (stockShort ? "error" : "hint");
      li.id = msgId;
      li.textContent = problems.join(" ");
      $(".lines", row).appendChild(li);
      approve.setAttribute("aria-disabled", "true");
      approve.setAttribute("aria-describedby", msgId);
      $(".status-cell", row).innerHTML = own
        ? '<span class="status"><span class="ico" aria-hidden="true">○</span>Pending · yours</span>'
        : '<span class="status alert"><span class="ico" aria-hidden="true">!</span>Short on stock</span>';
    } else {
      approve.removeAttribute("aria-disabled");
      approve.removeAttribute("aria-describedby");
      $(".status-cell", row).innerHTML = '<span class="status"><span class="ico" aria-hidden="true">○</span>Pending</span>';
    }
    if (own) { reject.setAttribute("aria-disabled", "true"); reject.setAttribute("aria-describedby", msgId); }
    approve.setAttribute("aria-label", "Approve request #" + row.getAttribute("data-request"));
    reject.setAttribute("aria-label", "Reject request #" + row.getAttribute("data-request"));
  });
  $("#pending-count").textContent = "(" + rows.length + ")";
  $("#pending-table .empty-row").hidden = rows.length > 0;
}

// Confirm dialog shared by Approve and Reject; onOk runs only after a deliberate confirm
function confirmDecision(kind, row, onOk) {
  var dialog = $("#decide-dialog");
  var id = row.getAttribute("data-request");
  var name = row.getAttribute("data-name");
  $("#decide-title").textContent = (kind === "approve" ? "Approve" : "Reject") + " Request #" + id + "?";
  var lines = $all("li[data-item-id]", row).map(function (li) {
    var itemId = li.getAttribute("data-item-id");
    var qty = Number(li.getAttribute("data-qty"));
    return "<li>" + esc(ITEM_NAMES[itemId]) + " ×" + qty +
      (kind === "approve" ? ' <span class="muted">· available ' + stock[itemId] + " → " + (stock[itemId] - qty) + "</span>" : "") + "</li>";
  }).join("");
  $("#decide-body").innerHTML = "<p>Requested by <strong>" + esc(name) + "</strong>.</p><ul>" + lines + "</ul>";
  $("#remarks-field").hidden = kind !== "reject";
  $("#d-remarks").value = "";
  $("#decide-ok").textContent = (kind === "approve" ? "Approve" : "Reject") + " #" + id;
  dialog.returnValue = "";
  dialog.onclose = function () { if (dialog.returnValue === "ok") onOk($("#d-remarks").value.trim()); };
  dialog.showModal(); // focus lands on Cancel first, so a stray Enter does nothing harmful
}

function setupRequests() {
  var dialog = $("#decide-dialog");
  $("#decide-cancel").addEventListener("click", function () { dialog.close("cancel"); });
  checkPending();

  // Mark a request decided in the pending table
  function decide(row, status, remarks) {
    row.classList.add("decided", "row-muted");
    var label = status === "approved" ? "✓</span>Approved" : "✕</span>Rejected";
    $(".status-cell", row).innerHTML = '<span class="status' + (status === "rejected" ? " done" : "") + '"><span class="ico" aria-hidden="true">' + label + "</span>";
    $(".actions-cell", row).innerHTML = '<span class="small muted">' + (status === "approved" ? "Approved" : "Rejected") + " by you" + (remarks ? ": " + esc(remarks) : "") + "</span>";
  }

  $("#pending-table").addEventListener("click", function (e) {
    var approveBtn = e.target.closest("[data-approve]");
    var rejectBtn = e.target.closest("[data-reject]");
    if (!approveBtn && !rejectBtn) return;
    var row = e.target.closest("tr");
    var id = row.getAttribute("data-request");

    if (approveBtn) {
      var problems = approvalProblems(row);
      if (problems.length) { toast("Can’t approve #" + id + ". " + problems[0]); return; }
      confirmDecision("approve", row, function () {
        // UPDATE item_request SET status='approved', decided_by=?, decided_at=NOW() WHERE request_id=?
        $all("li[data-item-id]", row).forEach(function (li) {
          var itemId = li.getAttribute("data-item-id");
          var qty = Number(li.getAttribute("data-qty"));
          stock[itemId] -= qty;
          if (isTool(itemId)) addLoan(itemId, qty, row, li);
        });
        decide(row, "approved");
        checkPending();
        $("#pending").focus();
        toast("Approved #" + id + " for " + row.getAttribute("data-name") + ". Stock updated.");
      });
    } else {
      if (Number(row.getAttribute("data-requested-by")) === CURRENT_USER) { toast("You can’t reject your own request. Ask another officer (chk_request_not_self)."); return; }
      confirmDecision("reject", row, function (remarks) {
        decide(row, "rejected", remarks);
        checkPending();
        $("#pending").focus();
        toast("Rejected #" + id + ".");
      });
    }
  });

  // New loan row in "Tools Out Now" after an approval
  function addLoan(itemId, qty, reqRow, li) {
    var due = $("time", li);
    var tr = document.createElement("tr");
    tr.setAttribute("data-item-id", itemId);
    tr.setAttribute("data-qty", qty);
    tr.innerHTML =
      '<td data-label="Line" class="num">new <span class="muted small">(#' + reqRow.getAttribute("data-request") + ")</span></td>" +
      '<td data-label="Tool"><strong>' + esc(ITEM_NAMES[itemId]) + " ×" + qty + "</strong></td>" +
      '<td data-label="Borrower">' + esc(reqRow.getAttribute("data-name")) + "</td>" +
      '<td data-label="Contact" class="muted">on file</td>' +
      '<td data-label="Due" class="num">' + (due ? due.outerHTML : "—") + "</td>" +
      '<td data-label="Status"><span class="status"><span class="ico" aria-hidden="true">→</span>Out</span></td>' +
      '<td class="actions-cell"><button class="btn btn-sm" type="button" data-return aria-label="Mark ' + esc(ITEM_NAMES[itemId]) + " returned by " + esc(reqRow.getAttribute("data-name")) + '">Mark Returned</button></td>';
    var tbody = $("#loans-table tbody");
    tbody.insertBefore(tr, $(".empty-row", tbody));
    $("#loans-table .empty-row").hidden = true;
  }

  // Mark returned: sets request_line.returned_at = NOW(); Undo within 7 s
  $("#loans-table").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-return]");
    if (!btn) return;
    var row = btn.closest("tr");
    var tbody = row.parentNode;
    var next = row.nextSibling;
    var itemId = row.getAttribute("data-item-id");
    var qty = Number(row.getAttribute("data-qty"));
    var label = $("strong", row).textContent;
    row.remove();
    $("#loans").focus(); // the clicked button is gone, keep keyboard users in this table
    stock[itemId] += qty;
    $(".empty-row", tbody).hidden = $all("tr:not(.empty-row)", tbody).length > 0;
    checkPending();
    toast("Returned: " + label + ". " + stock[itemId] + " now available.", function () {
      tbody.insertBefore(row, next);
      stock[itemId] -= qty;
      $(".empty-row", tbody).hidden = true;
      checkPending();
    });
  });

  setupRequestForm();
}

/* ---------- New request form: one fieldset per request_line ---------- */
var lineCount = 0;
function addLine() {
  var frag = $("#line-template").content.cloneNode(true);
  var fs = $("fieldset", frag);
  lineCount++;
  // Give each control a unique id so its <label for> works
  $all(".field", fs).forEach(function (field) {
    var control = $("select, input", field);
    control.id = "line" + lineCount + "-" + control.name;
    $("label", field).setAttribute("for", control.id);
  });
  $("legend", fs).textContent = "Item line " + lineCount;
  var item = $("select[name='item_id']", fs);
  var due = $("input[name='due_date']", fs);
  var hint = $(".due-hint", fs);
  hint.id = "line" + lineCount + "-due-hint";
  due.setAttribute("aria-describedby", hint.id);
  due.disabled = true;

  // Tools need a due date; consumables can’t have one (trg_line_consumable_ins)
  item.addEventListener("change", function () {
    if (!item.value) { due.disabled = true; hint.textContent = "Pick an item first."; return; }
    if (isTool(item.value)) {
      due.disabled = false;
      due.required = true;
      hint.textContent = "Tools are returned by this date.";
    } else {
      due.value = "";
      due.disabled = true;
      due.required = false;
      hint.textContent = "Consumables are used up, so no due date.";
    }
  });
  $(".remove-line", fs).addEventListener("click", function () {
    if ($all("#lines fieldset").length > 1) fs.remove();
    else toast("A request needs at least 1 item.");
  });
  $("#lines").appendChild(frag);
  return fs;
}

function setupRequestForm() {
  var form = $("#request-form");
  addLine();
  $("#add-line").addEventListener("click", function () { $("select", addLine()).focus(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    if (!form.requested_by.value) showError(form.requested_by, $("#n-member-err"));
    var seen = {};
    var lines = $all("#lines fieldset").map(function (fs) {
      var item = $("select[name='item_id']", fs);
      var qty = $("input[name='quantity']", fs);
      var due = $("input[name='due_date']", fs);
      var err = $(".line-err", fs);
      var n = parseInt(qty.value, 10);
      if (!item.value) showError(item, err, "Choose an item.");
      else if (seen[item.value]) showError(item, err, ITEM_NAMES[item.value] + " is already in this request. Change that line’s quantity instead (uq_line_request_item).");
      else if (isNaN(n) || n < 1) showError(qty, err, "Quantity must be 1 or more (chk_line_qty).");
      else if (isTool(item.value) && !due.value) showError(due, err, "Pick a due date for this tool.");
      else if (isTool(item.value) && due.value < "2026-11-23") showError(due, err, "The due date can’t be in the past.");
      seen[item.value] = true;
      return { id: item.value, qty: n, due: due.value };
    });
    if ($("[aria-invalid='true']", form)) { focusFirstError(form); return; }

    // INSERT INTO item_request (requested_by) ...; then one INSERT INTO request_line per line
    var requestId = 1015 + $all("#pending-table tr.new").length;
    var name = form.requested_by.options[form.requested_by.selectedIndex].text;
    var tr = document.createElement("tr");
    tr.className = "new";
    tr.setAttribute("data-request", requestId);
    tr.setAttribute("data-requested-by", form.requested_by.value);
    tr.setAttribute("data-name", name);
    tr.innerHTML =
      '<td data-label="Request" class="num">#' + requestId + "</td>" +
      '<td data-label="Requested by"><strong>' + esc(name) + "</strong></td>" +
      '<td data-label="Items"><ul class="lines">' + lines.map(function (l) {
        return '<li data-item-id="' + l.id + '" data-qty="' + l.qty + '">' + esc(ITEM_NAMES[l.id]) + " ×" + l.qty +
          ' <span class="muted small">· ' + (l.due ? 'due <time datetime="' + l.due + '" data-format="date">' + l.due + "</time>" : "consumable, no due date") + "</span></li>";
      }).join("") + "</ul></td>" +
      '<td data-label="Requested" class="num"><time datetime="' + new Date().toISOString().slice(0, 16) + '" data-format="datetime"></time></td>' +
      '<td data-label="Status" class="status-cell"></td>' +
      '<td class="actions-cell"><button class="btn btn-sm btn-primary" type="button" data-approve>Approve</button> <button class="btn btn-sm" type="button" data-reject>Reject</button></td>';
    $("#pending-table tbody").insertBefore(tr, $("#pending-table .empty-row"));
    formatTimes(tr);
    checkPending();
    toast("Request #" + requestId + " for " + name + " is pending. It’s at the bottom of the Pending list.");
    markClean(form);
    form.reset();
    $("#lines").innerHTML = "";
    addLine();
  });
}

/* =========================================================
   SETTINGS: add a row to a lookup table (role / purpose / category)
   ========================================================= */
function setupSettings() {
  $all(".lookup-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.name;
      var err = $(".error", form);
      var table = document.getElementById(form.getAttribute("data-table"));
      var name = input.value.trim();
      clearErrors(form);
      var taken = $all("td[data-label='Name']", table).some(function (td) { return td.textContent.toLowerCase() === name.toLowerCase(); });
      if (!name) { showError(input, err, "Enter a name."); input.focus(); return; }
      if (taken) { showError(input, err, name + " already exists. Names must be unique."); input.focus(); return; }
      var rows = $all("tbody tr", table).length;
      var tr = document.createElement("tr");
      var cells = '<td data-label="#" class="num">' + (rows + 1) + '</td><td data-label="Name">' + esc(name) + "</td>";
      if (form.can_approve) {
        cells += '<td data-label="Can approve">' + (form.can_approve.checked
          ? '<span class="status"><span class="ico" aria-hidden="true">✓</span>Yes</span>'
          : '<span class="status done"><span class="ico" aria-hidden="true">✕</span>No</span>') + '</td><td data-label="Members" class="num">0</td>';
      }
      tr.innerHTML = cells;
      $("tbody", table).appendChild(tr);
      toast("Added " + name + ".");
      form.reset();
    });
  });
}

/* ---------- Start the right page ---------- */
document.addEventListener("DOMContentLoaded", function () {
  var page = document.body.getAttribute("data-page");
  formatTimes(document);
  setupMenu();
  guardForms();
  var applyFilters = null;
  $all("form[data-filter-table]").forEach(function (f) { applyFilters = setupFilters(f); });

  if (page === "kiosk") setupKiosk();
  if (page === "attendance") setupAttendance();
  if (page === "people") setupPeople(applyFilters);
  if (page === "items") setupItems(applyFilters);
  if (page === "requests") setupRequests();
  if (page === "settings") setupSettings();
});
