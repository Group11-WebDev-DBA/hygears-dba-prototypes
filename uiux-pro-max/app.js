/* =========================================================
   Hygears HQ System - shared script for all 8 pages.
   Plain functions, no libraries. Each page's setup runs only
   when <body data-page="..."> matches. All data is SAMPLE data;
   the PHP rebuild replaces the arrays below with SQL queries.
   ========================================================= */

/* ---------- Small helpers ---------- */
function $(selector, root) { return (root || document).querySelector(selector); }
function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

// Same job as htmlspecialchars() in PHP: escape text before it goes into innerHTML
function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function pad(n) { return n < 10 ? "0" + n : String(n); }
function time12(d) { var h = d.getHours(); return (h % 12 || 12) + ":" + pad(d.getMinutes()) + (h < 12 ? " AM" : " PM"); }
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso) { var p = iso.split("-"); return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1]; }

var TODAY = "2026-11-24"; // the sample data's "today"; PHP uses CURDATE()
var ME = 2;               // person_id of the signed-in officer (Paolo Reyes)

/* ---------- Toast (aria-live) with optional Undo ---------- */
function toast(message, undo) {
  var region = $("#toast-region");
  region.innerHTML = "";
  var box = document.createElement("div");
  box.className = "toast";
  box.innerHTML = "<p>" + esc(message) + "</p>";
  if (undo) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Undo";
    btn.addEventListener("click", function () { box.remove(); undo(); });
    box.appendChild(btn);
  }
  region.appendChild(box);
  setTimeout(function () { box.remove(); }, undo ? 8000 : 5000);
}

/* ---------- Inline form errors ---------- */
function showError(input, message) {
  var err = document.getElementById(input.id + "-err");
  err.textContent = message;
  err.hidden = false;
  input.setAttribute("aria-invalid", "true");
  var ids = (input.getAttribute("aria-describedby") || "").split(" ");
  if (ids.indexOf(err.id) === -1) input.setAttribute("aria-describedby", (ids.join(" ") + " " + err.id).trim());
}
function clearErrors(form) {
  $all(".error", form).forEach(function (e) { e.hidden = true; });
  $all("[aria-invalid]", form).forEach(function (i) { i.removeAttribute("aria-invalid"); });
}
function focusFirstError(form) {
  var first = $("[aria-invalid='true']", form);
  if (first) first.focus();
  return !!first;
}
function digitsOnly(text) { return text.replace(/\D/g, ""); }

/* ---------- Mobile menu ---------- */
function setupMenu() {
  var btn = $(".menu-btn");
  var nav = $("#nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Close" : "Menu";
  });
}

/* ---------- Confirm dialog (native <dialog>) ---------- */
// opts: title, body (HTML), ok, danger, remarks (true = ask for a required reason), onOk(remarks)
function openDialog(opts) {
  var opener = document.activeElement;
  var d = document.createElement("dialog");
  d.setAttribute("aria-labelledby", "dlg-h");
  d.innerHTML =
    '<form novalidate><h2 id="dlg-h">' + esc(opts.title) + "</h2>" + opts.body +
    (opts.remarks ? '<div class="field"><label for="dlg-remarks">Reason the member will see <span class="col">remarks</span></label>' +
      '<textarea id="dlg-remarks" maxlength="255"></textarea><span class="error" id="dlg-remarks-err" hidden></span></div>' : "") +
    '<div class="actions"><button class="btn" type="button" data-cancel>Cancel</button>' +
    '<button class="btn ' + (opts.danger ? "btn-dark" : "btn-primary") + '" type="submit">' + esc(opts.ok) + "</button></div></form>";
  document.body.appendChild(d);
  var form = $("form", d);
  $("[data-cancel]", d).addEventListener("click", function () { d.close(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var remarks = "";
    if (opts.remarks) {
      var box = $("#dlg-remarks", d);
      clearErrors(form);
      remarks = box.value.trim();
      if (!remarks) { showError(box, "Write a short reason so the member knows what to do next."); box.focus(); return; }
    }
    d.close();
    opts.onOk(remarks);
  });
  d.addEventListener("close", function () {
    d.remove();
    if (opener && document.body.contains(opener)) opener.focus();
  });
  d.showModal();
  // Safe default: focus lands on Cancel (or the reason box), never on the confirm button
  (opts.remarks ? $("#dlg-remarks", d) : $("[data-cancel]", d)).focus();
}

/* ---------- Table filters kept in the URL (?q=&type=...) ---------- */
// Each control's name matches a data-* attribute on the rows; "q" searches the row text.
function setupFilters(form) {
  var table = document.getElementById(form.getAttribute("data-filter-table"));
  var countEl = document.getElementById(table.id.replace("-table", "-count"));
  var controls = $all("input[name], select[name]", form);

  var params = new URLSearchParams(location.search);
  controls.forEach(function (c) {
    if (!params.has(c.name)) return;
    if (c.type === "checkbox") c.checked = params.get(c.name) === c.value;
    else c.value = params.get(c.name);
  });

  function apply() {
    var rows = $all("tbody tr:not(.empty-row)", table);
    var query = new URLSearchParams();
    var shown = 0;
    controls.forEach(function (c) {
      if (c.type === "checkbox" ? c.checked : c.value) query.set(c.name, c.value);
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
    $(".empty-row", table).hidden = shown > 0;
    countEl.textContent = "Showing " + shown + " of " + rows.length + " " + countEl.getAttribute("data-noun");
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
   01 KIOSK (index.html)
   ========================================================= */
// person rows that have a student_id (members and PUP students)
var KIOSK_PEOPLE = [
  { id: 1, sid: "2023-00101-MN-0", name: "Mika Santos", tag: "Member" },
  { id: 2, sid: "2022-00214-MN-0", name: "Paolo Reyes", tag: "Officer" },
  { id: 3, sid: "2022-00187-MN-0", name: "Ana Lim", tag: "President" },
  { id: 4, sid: "2024-00342-MN-0", name: "Jun Bautista", tag: "Member" },
  { id: 5, sid: "2023-00456-MN-0", name: "Carla Mendoza", tag: "Member" },
  { id: 6, sid: "FAC-2019-0042", name: "Rafael Cruz", tag: "Adviser" }
];
var PURPOSE_NAMES = ["", "Meeting", "Project work", "Workshop", "Tool use", "Study", "Visit"];
// attendance rows WHERE time_out IS NULL (contact is only kept for visitors, to spot repeats)
var inside = [
  { id: 6, name: "Rafael Cruz", tag: "Adviser", purpose: "Workshop", since: "10:30 AM" },
  { id: 3, name: "Ana Lim", tag: "President", purpose: "Meeting", since: "10:15 AM" },
  { id: 7, name: "Lea Navarro", tag: "Visitor, TUP Manila", purpose: "Workshop", since: "10:00 AM", contact: "09185550107" },
  { id: 2, name: "Paolo Reyes", tag: "Officer", purpose: "Meeting", since: "9:05 AM" }
];
var nextVisitorId = 9;

// "2023 00101 mn 0", "202300101MN0" and "00101" all find 2023-00101-MN-0
function normalizeId(text) { return text.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function findStudent(text) {
  var key = normalizeId(text);
  if (!key) return null;
  var hit = KIOSK_PEOPLE.filter(function (p) { return normalizeId(p.sid) === key; })[0];
  if (hit) return hit;
  if (/^\d{5}$/.test(key)) {
    var serial = KIOSK_PEOPLE.filter(function (p) { return p.sid.split("-")[1] === key; });
    if (serial.length === 1) return serial[0];
  }
  return null;
}
function findInside(personId) {
  for (var i = 0; i < inside.length; i++) if (inside[i].id === personId) return inside[i];
  return null;
}

function renderInside() {
  var list = $("#inside-list");
  list.innerHTML = "";
  inside.forEach(function (p) {
    var li = document.createElement("li");
    li.id = "in-" + p.id;
    li.innerHTML =
      '<span class="person"><strong>' + esc(p.name) + "</strong><span>" + esc(p.tag) + " · " + esc(p.purpose) + " · in since " + esc(p.since) + "</span></span>" +
      '<button class="btn btn-dark" type="button" aria-label="Sign out ' + esc(p.name) + '">Sign out</button>';
    $("button", li).addEventListener("click", function () { signOut(p.id); });
    list.appendChild(li);
  });
  $("#inside-count").textContent = "(" + inside.length + ")";
  $("#jump-count").textContent = inside.length + " inside";
  $("#inside-empty").hidden = inside.length > 0;
}

// Sign out = UPDATE attendance SET time_out = NOW(); Undo puts the row back
function signOut(personId) {
  var index = inside.indexOf(findInside(personId));
  var person = inside.splice(index, 1)[0];
  renderInside();
  hideAlready();
  toast("Signed out " + person.name + " at " + time12(new Date()) + ". See you!", function () {
    inside.splice(index, 0, person);
    renderInside();
    toast(person.name + " is signed in again.");
  });
}

// Scroll to someone's row in "In the HQ now" and focus their Sign out button
function goToSignOut(personId) {
  var li = document.getElementById("in-" + personId);
  if (!li) return;
  $all(".inside-list li").forEach(function (x) { x.classList.remove("flash"); });
  li.classList.add("flash");
  li.scrollIntoView({ block: "center" });
  $("button", li).focus();
}

var alreadyFor = null;
function showAlready(entry) {
  alreadyFor = entry.id;
  $("#already-text").textContent = entry.name + " has been inside since " + entry.since + " (" + entry.purpose + "). Sign out first if you're leaving, or just go in.";
  $("#already").hidden = false;
}
function hideAlready() { alreadyFor = null; $("#already").hidden = true; }

function setupKiosk() {
  var form = $("#signin-form");
  var sid = $("#k-sid");
  var done = $("#signin-done");
  var resetTimer = null;

  function tick() {
    var now = new Date();
    $("#clock-time").textContent = time12(now);
    $("#clock-date").textContent = now.toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short" });
  }
  tick();
  setInterval(tick, 30000);
  renderInside();

  // PUP student / Visitor switch
  $all("input[name='kind']", form).forEach(function (radio) {
    radio.addEventListener("change", function () {
      var visitor = form.kind.value === "visitor";
      $("#student-fields").hidden = visitor;
      $("#visitor-fields").hidden = !visitor;
      clearErrors(form);
      hideAlready();
      (visitor ? $("#k-first") : sid).focus();
    });
  });

  // Live match while typing: show the name, and warn right away if already inside
  sid.addEventListener("input", function () {
    var p = findStudent(sid.value);
    $("#k-sid-match").textContent = p ? "✓ " + p.name + ", " + p.tag : "";
    $("#k-sid-err").hidden = true;
    sid.removeAttribute("aria-invalid");
    var entry = p && findInside(p.id);
    if (entry) showAlready(entry); else hideAlready();
  });

  $all("input[name='purpose_id']", form).forEach(function (r) {
    r.addEventListener("change", function () { $("#k-purpose-err").hidden = true; });
  });

  $("#already-go").addEventListener("click", function () { if (alreadyFor) goToSignOut(alreadyFor); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var visitor = form.kind.value === "visitor";
    var purpose = form.querySelector("input[name='purpose_id']:checked");
    var who = null;

    if (!visitor) {
      who = findStudent(sid.value);
      if (!sid.value.trim()) showError(sid, "Type your student number.");
      else if (!who) showError(sid, "That student number isn't on file. Check it, or ask an officer to add you on the People page.");
    } else {
      var first = $("#k-first"), last = $("#k-last"), contact = $("#k-contact"), aff = $("#k-aff");
      if (!first.value.trim()) showError(first, "Type your first name.");
      if (!last.value.trim()) showError(last, "Type your last name.");
      if (digitsOnly(contact.value).length !== 11) showError(contact, "Use 11 digits, like 0918 555 0107.");
      if (!aff.value.trim()) showError(aff, "Type your school or organization.");
      if (!$("[aria-invalid='true']", form)) {
        who = { id: nextVisitorId, name: first.value.trim() + " " + last.value.trim(), tag: "Visitor, " + aff.value.trim(), contact: digitsOnly(contact.value) };
      }
    }
    if (!purpose) { $("#k-purpose-err").textContent = "Pick why you're here."; $("#k-purpose-err").hidden = false; }
    if (focusFirstError(form)) return;
    if (!purpose) { $("#purposes input").focus(); return; }

    // Block a second sign-in: members by person_id, visitors by contact number
    var entry = visitor
      ? inside.filter(function (x) { return x.contact && x.contact === who.contact; })[0]
      : findInside(who.id);
    if (entry) { showAlready(entry); $("#already-go").focus(); return; }

    if (visitor) nextVisitorId++;
    var row = { id: who.id, name: who.name, tag: who.tag, purpose: PURPOSE_NAMES[purpose.value], since: time12(new Date()), contact: who.contact };
    inside.unshift(row);
    renderInside();

    // Big confirmation, then reset for the next person
    form.hidden = true;
    done.hidden = false;
    $("#done-name").textContent = "Welcome, " + who.name.split(" ")[0] + "!";
    $("#done-detail").textContent = "Signed in at " + row.since + " for " + row.purpose + ". Remember to sign out when you leave.";
    done.focus();
    resetTimer = setTimeout(resetKiosk, 8000);
  });

  function resetKiosk() {
    clearTimeout(resetTimer);
    form.reset();
    $("#student-fields").hidden = false;
    $("#visitor-fields").hidden = true;
    $("#k-sid-match").textContent = "";
    hideAlready();
    done.hidden = true;
    form.hidden = false;
    sid.focus();
  }
  $("#done-next").addEventListener("click", resetKiosk);
}

/* =========================================================
   03 ATTENDANCE
   ========================================================= */
function setupAttendance() {
  setupFilters($("#att-filters"));
  // shortcut: export is a stub; PHP sends the filtered rows as text/csv
  $("#export-btn").addEventListener("click", function () {
    toast("Export is a stub in the prototype. The PHP version downloads the filtered rows as CSV.");
  });
}

/* =========================================================
   04 PEOPLE
   ========================================================= */
var nextPersonId = 9;
function setupPeople() {
  var refilter = setupFilters($("#people-filters"));
  var table = $("#people-table");

  // Activate / deactivate a member (member.is_active)
  table.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-toggle-active]");
    if (!btn) return;
    var row = btn.closest("tr");
    var name = $("strong", row).textContent;
    var nowActive = row.getAttribute("data-active") !== "yes";
    row.setAttribute("data-active", nowActive ? "yes" : "no");
    $(".status-cell", row).innerHTML = nowActive
      ? '<span class="tag"><span class="ico" aria-hidden="true">✓</span>Active</span>'
      : '<span class="tag off"><span class="ico" aria-hidden="true">–</span>Inactive</span>';
    btn.textContent = nowActive ? "Deactivate" : "Activate";
    btn.setAttribute("aria-label", btn.textContent + " " + name);
    toast(name + (nowActive ? " is active again." : " is now inactive and can't borrow or approve."));
  });

  var form = $("#person-form");
  var memberBox = $("#ap-member");
  memberBox.addEventListener("change", function () { $("#member-fields").hidden = !memberBox.checked; });
  form.addEventListener("reset", function () { clearErrors(form); $("#member-fields").hidden = true; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var first = $("#ap-first"), last = $("#ap-last"), sid = $("#ap-sid"), contact = $("#ap-contact"), email = $("#ap-email");
    var sidValue = sid.value.trim().toUpperCase();
    if (!first.value.trim()) showError(first, "Enter a first name.");
    if (!last.value.trim()) showError(last, "Enter a last name.");
    if (digitsOnly(contact.value).length !== 11) showError(contact, "Use 11 digits, like 0917 555 0109.");
    var taken = $all("td[data-label='student_id'] .mono", table).some(function (td) { return td.textContent === sidValue; });
    if (sidValue && taken) showError(sid, "That student ID is already on file (uq_person_student_id).");
    if (memberBox.checked && !sidValue) showError(sid, "Members need a student ID (trg_member_requires_student_id_ins). Leave \"member\" unticked for visitors.");
    if (memberBox.checked && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) showError(email, "That email doesn't look right.");
    if (focusFirstError(form)) return;

    var member = memberBox.checked;
    var roleText = member ? $("#ap-role").selectedOptions[0].textContent : "";
    var active = $("#ap-active").checked;
    var name = first.value.trim() + " " + last.value.trim();
    var row = document.createElement("tr");
    row.setAttribute("data-type", member ? "member" : (sidValue ? "pup" : "visitor"));
    row.setAttribute("data-active", member && active ? "yes" : "no");
    row.innerHTML =
      '<td data-label="person_id" class="num">' + nextPersonId++ + "</td>" +
      '<td data-label="Name"><strong>' + esc(name) + "</strong>" + (member && email.value ? '<span class="sub">' + esc(email.value) + "</span>" : "") + "</td>" +
      '<td data-label="student_id">' + (sidValue ? '<span class="mono">' + esc(sidValue) + "</span>" : '<span class="muted">None (visitor)</span>') + "</td>" +
      '<td data-label="contact_number" class="nowrap">' + esc(contact.value.trim()) + "</td>" +
      '<td data-label="affiliation">' + esc($("#ap-aff").value.trim()) + "</td>" +
      '<td data-label="Role">' + (member ? esc(roleText) + '<span class="sub">joined ' + esc(shortDate($("#ap-joined").value || TODAY)) + "</span>" : '<span class="muted">Not a member</span>') + "</td>" +
      '<td data-label="is_active" class="status-cell">' + (member ? (active ? '<span class="tag"><span class="ico" aria-hidden="true">✓</span>Active</span>' : '<span class="tag off"><span class="ico" aria-hidden="true">–</span>Inactive</span>') : '<span class="muted">n/a</span>') + "</td>" +
      '<td class="actions-cell">' + (member ? '<button class="btn" type="button" data-toggle-active aria-label="' + (active ? "Deactivate " : "Activate ") + esc(name) + '">' + (active ? "Deactivate" : "Activate") + "</button>" : "") + "</td>";
    $("tbody", table).insertBefore(row, $(".empty-row", table));
    form.reset();
    refilter();
    toast("Saved " + name + (member ? " as " + roleText + "." : " as a person (not a member)."));
  });
}

/* =========================================================
   05 ITEMS
   ========================================================= */
var nextItemId = 13, nextRestockId = 8;
var CATEGORY_NAMES = ["", "Hand tools", "Power tools", "Electronics", "Measuring instruments", "Cutting consumables", "Soldering consumables"];

// Redraw one item row from its data-* attributes (the same values v_item_stock returns)
function paintItemRow(row) {
  var d = row.dataset;
  var avail = Number(d.available);
  var low = d.active === "yes" && d.reorder !== "" && avail <= Number(d.reorder);
  d.low = low ? "yes" : "no";
  row.className = low ? "row-alert" : "";
  var status = d.active !== "yes" ? '<span class="tag off"><span class="ico" aria-hidden="true">–</span>Inactive</span>'
    : low ? '<span class="tag alert"><span class="ico" aria-hidden="true">!</span>Low stock</span>'
    : avail === 0 ? '<span class="tag off"><span class="ico" aria-hidden="true">0</span>All out</span>'
    : '<span class="tag"><span class="ico" aria-hidden="true">✓</span>In stock</span>';
  row.innerHTML =
    '<td data-label="item_id" class="num">' + d.id + "</td>" +
    '<td data-label="Item"><strong>' + esc(d.name) + "</strong></td>" +
    '<td data-label="Category">' + esc(d.category) + "</td>" +
    '<td data-label="item_type">' + d.type + "</td>" +
    '<td data-label="quantity_total" class="num">' + d.total + "</td>" +
    '<td data-label="Available" class="num">' + avail + "</td>" +
    '<td data-label="reorder_level" class="num">' + (d.reorder === "" ? '<span class="muted">None</span>' : d.reorder) + "</td>" +
    '<td data-label="Status">' + status + "</td>" +
    '<td class="actions-cell"><button class="btn" type="button" data-edit aria-label="Edit ' + esc(d.name) + '">Edit</button></td>';
}

function setupItems() {
  var refilter = setupFilters($("#item-filters"));
  var table = $("#item-table");
  var form = $("#item-form");
  var editing = null; // the row being edited, or null when adding

  function setMode(row) {
    editing = row;
    $("#item-form-h").textContent = row ? "Edit item #" + row.dataset.id : "Add an item";
    $("#item-form-tag").textContent = row ? "UPDATE item" : "INSERT INTO item";
    $("#if-submit").textContent = row ? "Save changes" : "Save item";
    $("#if-cancel").hidden = !row;
  }

  // Edit: copy the row's values into the form
  table.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-edit]");
    if (!btn) return;
    var d = btn.closest("tr").dataset;
    clearErrors(form);
    $("#if-id").value = d.id;
    $("#if-name").value = d.name;
    $("#if-cat").value = String(CATEGORY_NAMES.indexOf(d.category));
    form.querySelector("input[value='" + d.type + "']").checked = true;
    $("#if-total").value = d.total;
    $("#if-reorder").value = d.reorder;
    $("#if-active").checked = d.active === "yes";
    setMode(btn.closest("tr"));
    $("#item-panel").scrollIntoView({ block: "start" });
    $("#if-name").focus();
  });
  $("#if-cancel").addEventListener("click", function () { form.reset(); clearErrors(form); setMode(null); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var name = $("#if-name"), cat = $("#if-cat"), total = $("#if-total"), reorder = $("#if-reorder");
    var type = form.item_type.value;
    var clash = $all("tbody tr[data-id]", table).some(function (r) {
      return r !== editing && r.dataset.name.toLowerCase() === name.value.trim().toLowerCase();
    });
    if (!name.value.trim()) showError(name, "Enter the item name.");
    else if (clash) showError(name, "An item with that name already exists (uq_item_name).");
    if (!cat.value) showError(cat, "Choose a category.");
    if (!/^\d+$/.test(total.value)) showError(total, "Use a whole number, 0 or more.");
    if (reorder.value !== "" && !/^\d+$/.test(reorder.value)) showError(reorder, "Use a whole number, or leave it empty.");
    if (type === "consumable" && reorder.value === "") showError(reorder, "Consumables need a reorder level so low stock gets flagged.");
    if (focusFirstError(form)) return;

    var row = editing || document.createElement("tr");
    var oldTotal = editing ? Number(row.dataset.total) : 0;
    var oldAvail = editing ? Number(row.dataset.available) : 0;
    row.dataset.id = editing ? row.dataset.id : nextItemId++;
    row.dataset.name = name.value.trim();
    row.dataset.category = CATEGORY_NAMES[Number(cat.value)];
    row.dataset.type = type;
    row.dataset.total = total.value;
    // Available moves by the same amount the total changed (units out stay out)
    row.dataset.available = oldAvail + (Number(total.value) - oldTotal);
    row.dataset.reorder = reorder.value;
    row.dataset.active = $("#if-active").checked ? "yes" : "no";
    paintItemRow(row);
    if (!editing) $("tbody", table).insertBefore(row, $(".empty-row", table));
    if (!editing && type === "consumable") {
      var opt = document.createElement("option");
      opt.value = row.dataset.id;
      opt.textContent = row.dataset.name + " (" + row.dataset.available + " left)";
      $("#rs-item").appendChild(opt);
    }
    toast((editing ? "Saved changes to " : "Added ") + row.dataset.name + ".");
    form.reset();
    setMode(null);
    refilter();
  });

  // Restock: INSERT INTO restock; v_item_stock adds it to quantity_available
  var rform = $("#restock-form");
  rform.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(rform);
    var item = $("#rs-item"), qty = $("#rs-qty"), date = $("#rs-date");
    if (!item.value) showError(item, "Choose the consumable you restocked.");
    if (!/^\d+$/.test(qty.value) || Number(qty.value) < 1) showError(qty, "Enter how many you added, 1 or more (chk_restock_qty).");
    if (!date.value) showError(date, "Enter the restock date.");
    else if (date.value > TODAY) showError(date, "The date can't be in the future.");
    if (focusFirstError(rform)) return;

    var row = $("tr[data-id='" + item.value + "']", table);
    row.dataset.available = Number(row.dataset.available) + Number(qty.value);
    paintItemRow(row);
    item.selectedOptions[0].textContent = row.dataset.name + " (" + row.dataset.available + " left)";
    var log = document.createElement("tr");
    log.innerHTML = '<td data-label="restock_id" class="num">' + nextRestockId++ + '</td><td data-label="Item">' + esc(row.dataset.name) +
      '</td><td data-label="quantity" class="num">' + qty.value + '</td><td data-label="restocked_on" class="num">' + shortDate(date.value) + "</td>";
    $("#restock-table tbody").insertBefore(log, $("#restock-table tbody tr"));
    toast("Restocked " + row.dataset.name + ": +" + qty.value + ", now " + row.dataset.available + " available" + (row.dataset.low === "yes" ? ", still low." : "."));
    rform.reset();
    date.value = TODAY;
    refilter();
  });
}

/* =========================================================
   06 REQUESTS
   ========================================================= */
// v_item_stock.quantity_available, keyed by item_id. Approvals subtract, returns add back.
var STOCK = { 1: 1, 2: 1, 3: 3, 4: 2, 5: 1, 6: 0, 7: 1, 8: 3, 9: 5, 10: 4, 11: 9, 12: 11 };
var ITEMS = {
  1: "Cordless drill", 2: "Digital multimeter", 3: "Soldering iron 60 W", 4: "Vernier caliper", 5: "Socket wrench set", 6: "Angle grinder",
  7: "Oscilloscope", 8: "Solder wire 0.8 mm", 9: "Flux paste", 10: "Cutting disc 4 in", 11: "Heat-shrink tubing pack", 12: "Hacksaw blade"
};
var PEOPLE_NAMES = { 1: "Mika Santos", 2: "Paolo Reyes", 3: "Ana Lim", 4: "Jun Bautista", 6: "Rafael Cruz" };
var PEOPLE_CONTACT = { 1: "0917 555 0101", 2: "0917 555 0102", 3: "0917 555 0103", 4: "0917 555 0104", 6: "0917 555 0106" };
var nextRequestId = 1016, nextLineId = 30;

function requestLines(row) {
  return $all("li[data-item-id]", row).map(function (li) {
    return { li: li, item: Number(li.dataset.itemId), qty: Number(li.dataset.qty), due: li.dataset.due };
  });
}

// Re-check every pending request against current stock; block Approve with a reason when needed
function refreshPending() {
  var rows = $all("#pending-table tbody tr[data-request]");
  rows.forEach(function (row) {
    var lines = requestLines(row);
    var short = [];
    lines.forEach(function (l) {
      var avail = STOCK[l.item];
      var tag = $(".avail", l.li);
      tag.textContent = avail + " available";
      if (l.qty > avail) {
        short.push(ITEMS[l.item] + " asks " + l.qty + ", only " + avail + " available");
        tag.textContent = "only " + avail + " available";
      }
    });
    var self = Number(row.dataset.by) === ME;
    var msg = $(".short", row);
    var approve = $("[data-approve]", row);
    var reject = $("[data-reject]", row);
    if (self) msg.textContent = "Your own request. Another officer has to decide it (chk_request_not_self).";
    else if (short.length) msg.textContent = "Not enough stock: " + short.join("; ") + ". Wait for a return or restock, or reject and ask for fewer.";
    msg.hidden = !self && !short.length;
    approve.setAttribute("aria-disabled", self || short.length ? "true" : "false");
    reject.setAttribute("aria-disabled", self ? "true" : "false");
  });
  $("#pending-count").textContent = "(" + rows.length + ")";
  $("#pending-table .empty-row").hidden = rows.length > 0;
}

function addHistory(id, by, status, remarks) {
  var labels = { approved: ["", "✓", "Approved"], rejected: ["off", "✕", "Rejected"] };
  var l = labels[status];
  var tr = document.createElement("tr");
  tr.innerHTML = '<td data-label="request_id" class="num">#' + id + '</td><td data-label="requested_by">' + esc(by) + "</td>" +
    '<td data-label="status"><span class="tag ' + l[0] + '"><span class="ico" aria-hidden="true">' + l[1] + "</span>" + l[2] + "</span></td>" +
    '<td data-label="decided_by">Paolo Reyes</td><td data-label="decided_at" class="num">' + shortDate(TODAY) + ", " + time12(new Date()) + "</td>" +
    '<td data-label="remarks">' + (remarks ? esc(remarks) : '<span class="muted">None</span>') + "</td>";
  var body = $("#history-table tbody");
  body.insertBefore(tr, body.firstChild);
}

function refreshLoans() {
  var n = $all("#loan-table tbody tr[data-line]").length;
  $("#loan-count").textContent = "(" + n + ")";
  $("#loan-table .empty-row").hidden = n > 0;
}

function approveRequest(row) {
  var id = row.dataset.request;
  var by = $("strong", row).textContent;
  var lines = requestLines(row);
  var list = lines.map(function (l) {
    return "<li><strong>" + esc(ITEMS[l.item]) + " ×" + l.qty + "</strong> · " + STOCK[l.item] + " available → " + (STOCK[l.item] - l.qty) + " after" +
      (l.due ? ", due " + shortDate(l.due) : ", consumable") + "</li>";
  }).join("");
  openDialog({
    title: "Approve request #" + id + "?",
    body: "<p>For <strong>" + esc(by) + "</strong>. These quantities leave stock now:</p><ul>" + list + "</ul>",
    ok: "Approve #" + id,
    onOk: function () {
      // Re-check right before saving (stock may have changed); PHP repeats this in a transaction
      var shortNow = lines.filter(function (l) { return l.qty > STOCK[l.item]; });
      if (shortNow.length) { refreshPending(); toast("Stock changed. Request #" + id + " can't be approved now."); return; }
      lines.forEach(function (l) {
        STOCK[l.item] -= l.qty;
        if (l.due) addLoan(id, l.item, l.qty, Number(row.dataset.by), l.due);
      });
      row.remove();
      addHistory(id, by, "approved", "");
      refreshPending();
      refreshLoans();
      toast("Approved #" + id + " for " + by + ". Stock updated.");
    }
  });
}

function addLoan(requestId, item, qty, personId, due) {
  var tr = document.createElement("tr");
  tr.dataset.line = nextLineId;
  tr.dataset.itemId = item;
  tr.dataset.qty = qty;
  tr.innerHTML = '<td data-label="line_id" class="num">' + nextLineId++ + '<span class="sub">req #' + requestId + "</span></td>" +
    '<td data-label="Tool"><strong>' + esc(ITEMS[item]) + " ×" + qty + "</strong></td>" +
    '<td data-label="Borrower">' + esc(PEOPLE_NAMES[personId]) + '<span class="sub">' + PEOPLE_CONTACT[personId] + "</span></td>" +
    '<td data-label="due_date" class="num">' + shortDate(due) + "</td>" +
    '<td data-label="is_overdue"><span class="tag"><span class="ico" aria-hidden="true">→</span>Out</span></td>' +
    '<td class="actions-cell"><button class="btn" type="button" data-return aria-label="Mark ' + esc(ITEMS[item]) + " returned by " + esc(PEOPLE_NAMES[personId]) + '">Mark returned</button></td>';
  $("#loan-table tbody").insertBefore(tr, $("#loan-table .empty-row"));
}

function setupRequests() {
  refreshPending();
  refreshLoans();

  $("#pending-table").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var row = btn.closest("tr");
    // Blocked buttons stay focusable and explain themselves instead of doing nothing
    if (btn.getAttribute("aria-disabled") === "true") {
      toast($(".short", row).textContent);
      return;
    }
    if (btn.hasAttribute("data-approve")) approveRequest(row);
    if (btn.hasAttribute("data-reject")) {
      var id = row.dataset.request, by = $("strong", row).textContent;
      openDialog({
        title: "Reject request #" + id + "?",
        body: "<p>" + esc(by) + " will see your reason in <code>remarks</code>. Nothing leaves stock.</p>",
        ok: "Reject #" + id, danger: true, remarks: true,
        onOk: function (remarks) {
          row.remove();
          addHistory(id, by, "rejected", remarks);
          refreshPending();
          toast("Rejected #" + id + ".");
        }
      });
    }
  });

  // Mark returned: request_line.returned_at = NOW(); the tool goes back into stock
  $("#loan-table").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-return]");
    if (!btn) return;
    var row = btn.closest("tr");
    var next = row.nextElementSibling;
    var item = Number(row.dataset.itemId), qty = Number(row.dataset.qty);
    row.remove();
    STOCK[item] += qty;
    refreshLoans();
    refreshPending();
    toast(ITEMS[item] + " ×" + qty + " returned. " + STOCK[item] + " available now.", function () {
      STOCK[item] -= qty;
      next.parentNode.insertBefore(row, next);
      refreshLoans();
      refreshPending();
    });
  });

  // New request form: due date only for tools
  var form = $("#request-form");
  $all(".req-line", form).forEach(function (fs) {
    var n = fs.dataset.line;
    var item = $("#rl-item-" + n), due = $("#rl-due-" + n), hint = $("#rl-due-" + n + "-hint");
    item.addEventListener("change", function () {
      var opt = item.selectedOptions[0];
      var type = opt.dataset.type;
      due.disabled = type !== "tool";
      if (type !== "tool") due.value = "";
      hint.textContent = type === "tool" ? "Required for tools." : type === "consumable" ? "None: consumables aren't returned." : "Pick a tool first.";
      $("#rl-avail-" + n).textContent = item.value ? STOCK[item.value] + " available now" : "";
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors(form);
    var by = $("#nr-by");
    if (!by.value) showError(by, "Choose who is borrowing.");
    var lines = [];
    $all(".req-line", form).forEach(function (fs) {
      var n = fs.dataset.line;
      var item = $("#rl-item-" + n), qty = $("#rl-qty-" + n), due = $("#rl-due-" + n);
      if (!item.value) {
        if (n === "1") showError(item, "Choose at least one item.");
        return;
      }
      if (lines.some(function (l) { return l.item === Number(item.value); })) showError(item, "This item is already on the request. Raise its quantity instead (uq_line_request_item).");
      if (!/^\d+$/.test(qty.value) || Number(qty.value) < 1) showError(qty, "Use 1 or more.");
      var isTool = item.selectedOptions[0].dataset.type === "tool";
      if (isTool && !due.value) showError(due, "Tools need a due date.");
      else if (isTool && due.value < TODAY) showError(due, "The due date can't be in the past.");
      lines.push({ item: Number(item.value), qty: Number(qty.value), due: isTool ? due.value : "" });
    });
    if (focusFirstError(form)) return;

    var id = nextRequestId++;
    var personId = Number(by.value);
    var role = by.selectedOptions[0].textContent.replace(/^.*\((.*)\)$/, "$1");
    var tr = document.createElement("tr");
    tr.dataset.request = id;
    tr.dataset.by = personId;
    tr.innerHTML = '<td data-label="request_id" class="num">#' + id + "</td>" +
      '<td data-label="requested_by"><strong>' + esc(PEOPLE_NAMES[personId]) + '</strong><span class="sub">' + esc(role) + "</span></td>" +
      '<td data-label="requested_at" class="num">' + time12(new Date()) + "</td>" +
      '<td data-label="Lines"><ul>' + lines.map(function (l) {
        return '<li data-item-id="' + l.item + '" data-qty="' + l.qty + '" data-due="' + l.due + '"><strong>' + esc(ITEMS[l.item]) + " ×" + l.qty + "</strong> " +
          '<span class="sub">' + (l.due ? "due " + shortDate(l.due) : "consumable, no due date") + ' · <span class="avail"></span></span></li>';
      }).join("") + '</ul><span class="short" id="short-' + id + '" hidden></span></td>' +
      '<td class="actions-cell"><div class="actions"><button class="btn btn-primary" type="button" data-approve aria-describedby="short-' + id + '">Approve</button>' +
      '<button class="btn" type="button" data-reject>Reject</button></div></td>';
    $("#pending-table tbody").insertBefore(tr, $("#pending-table .empty-row"));
    refreshPending();
    form.reset();
    $all(".req-line input[type='date']", form).forEach(function (d) { d.disabled = true; });
    $all(".req-line .hint", form).forEach(function (h) { h.textContent = h.id.indexOf("avail") > -1 ? "" : "Pick a tool first."; });
    toast("Request #" + id + " submitted. It's waiting in Pending.");
    $("#pending").scrollIntoView({ block: "start" });
  });
}

/* =========================================================
   08 SETTINGS: add rows to the lookup tables
   ========================================================= */
function setupSettings() {
  $all(".lookup-form").forEach(function (form) {
    var tableId = form.id.replace("-form", "-table");
    var input = $("input[name='name']", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);
      var value = input.value.trim();
      var rows = $all("#" + tableId + " tbody tr");
      var exists = rows.some(function (r) { return $("strong", r).textContent.toLowerCase() === value.toLowerCase(); });
      if (!value) showError(input, "Type a name.");
      else if (exists) showError(input, "\"" + value + "\" already exists. Names are unique.");
      if (focusFirstError(form)) return;
      var tr = document.createElement("tr");
      var idLabel = tableId.replace("-table", "") + "_id";
      tr.innerHTML = '<td data-label="' + idLabel + '" class="num">' + (rows.length + 1) + '</td><td data-label="name"><strong>' + esc(value) + "</strong></td>";
      var approve = $("input[name='can_approve']", form);
      if (approve) {
        tr.innerHTML += '<td data-label="can_approve">' + (approve.checked
          ? '<span class="tag dark"><span class="ico" aria-hidden="true">✓</span>Can approve</span>'
          : '<span class="tag off"><span class="ico" aria-hidden="true">✕</span>Cannot approve</span>') + "</td>";
      }
      $("#" + tableId + " tbody").appendChild(tr);
      form.reset();
      toast("Added \"" + value + "\".");
    });
  });
}

/* ---------- Start the right page ---------- */
document.addEventListener("DOMContentLoaded", function () {
  setupMenu();
  var pages = { index: setupKiosk, attendance: setupAttendance, people: setupPeople, items: setupItems, requests: setupRequests, settings: setupSettings };
  var run = pages[document.body.getAttribute("data-page")];
  if (run) run();
});
