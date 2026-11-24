/* Hygears HQ System prototype - small vanilla JS for the page states.
   No data is saved: the PHP rebuild replaces each handler with a form POST.
   Each section only runs if its page has the matching element. */

document.documentElement.classList.add("js");

// Sample people the kiosk can recognise (person.student_id -> name, member or not)
var PEOPLE = {
  "2023-00141-MN-0": { name: "Mika Reyes", member: true },
  "2022-00377-MN-0": { name: "Paolo Santos", member: true },
  "2022-00512-MN-0": { name: "Bea Villanueva", member: true },
  "2024-00088-MN-0": { name: "Carlo Mendoza", member: true },
  "2023-00620-MN-0": { name: "Jessa Ramos", member: true },
  "2021-00733-MN-0": { name: "Ken Bautista", member: true },
  "2025-01234-MN-0": { name: "Nico Ferrer", member: false }
};

// The signed-in officer for this prototype (decided_by on requests)
var CURRENT_USER = "Paolo Santos";

/* ---------- Helpers ---------- */

// Current time as HH:MM, like the time part of time_in / time_out
function nowTime() {
  var d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Show a message in a live region so screen readers announce it
function say(box, text, kind) {
  if (!box) return;
  box.classList.remove("msg-alert", "msg-ok");      // keep the box's other classes
  box.classList.add(kind === "alert" ? "msg-alert" : "msg-ok");
  box.innerHTML = '<span class="icon ' + (kind === "alert" ? "icon-alert" : "icon-ok") + '" aria-hidden="true">' +
    (kind === "alert" ? "!" : "&#10003;") + "</span><p>" + text + "</p>";
  box.hidden = false;
}

// Put an error under a field and mark it invalid (or clear it when text is empty)
function fieldError(input, text) {
  var err = document.getElementById(input.id + "-error");
  if (text) {
    input.setAttribute("aria-invalid", "true");
    if (err) { err.textContent = text; err.hidden = false; }
  } else {
    input.removeAttribute("aria-invalid");
    if (err) { err.textContent = ""; err.hidden = true; }
  }
  return !text;
}

// Escape text before putting it into innerHTML (the PHP side uses htmlspecialchars)
function esc(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ---------- Menu button (all pages, under 1024px) ---------- */
var menuBtn = document.querySelector(".menu-btn");
if (menuBtn) {
  menuBtn.addEventListener("click", function () {
    var nav = document.getElementById("site-nav");
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* ---------- Door kiosk: sign in ---------- */
var signIn = document.getElementById("sign-in-form");
if (signIn) {
  var idInput = document.getElementById("student_id");
  var found = document.getElementById("found");
  var newFields = document.getElementById("new-person");
  var visitorFields = document.getElementById("visitor-fields");
  var memberFields = document.getElementById("member-fields");
  var kioskMsg = document.getElementById("kiosk-msg");

  // Switch between "I have a PUP student number" and "Visitor"
  signIn.querySelectorAll('input[name="who"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      var visitor = radio.value === "visitor" && radio.checked;
      visitorFields.hidden = !visitor;
      memberFields.hidden = visitor;
    });
  });

  // Look the number up as it is typed and greet the person
  idInput.addEventListener("input", function () {
    var person = PEOPLE[idInput.value.trim().toUpperCase()];
    fieldError(idInput, "");
    if (person) {
      found.textContent = "Welcome back, " + person.name + ".";
      found.hidden = false;
      newFields.hidden = true;
    } else {
      found.hidden = true;
    }
  });

  signIn.addEventListener("submit", function (e) {
    e.preventDefault();
    var visitor = document.getElementById("who-visitor").checked;
    var purpose = signIn.querySelector('input[name="purpose_id"]:checked');
    var purposeBox = document.getElementById("purpose-choices");
    var ok = true;
    var name = "";
    var detail = "";

    if (visitor) {
      ["v_first_name", "v_last_name", "v_contact_number", "v_affiliation"].forEach(function (id) {
        var input = document.getElementById(id);
        if (!fieldError(input, input.value.trim() ? "" : "Required for visitors.")) ok = false;
      });
      name = document.getElementById("v_first_name").value.trim() + " " + document.getElementById("v_last_name").value.trim();
      detail = "Visitor, " + document.getElementById("v_affiliation").value.trim();
    } else {
      var id = idInput.value.trim().toUpperCase();
      var person = PEOPLE[id];
      if (!id) {
        ok = fieldError(idInput, "Type your student number, or choose Visitor.");
      } else if (!/^\d{4}-\d{5}-[A-Z]{2}-\d$/.test(id)) {
        ok = fieldError(idInput, "That doesn't look like a PUP student number. Example: 2023-00141-MN-0");
      } else if (insideList.querySelector('li[data-sid="' + id + '"]:not([data-out])')) {
        // one open attendance row per person: they should sign out, not in again
        ok = fieldError(idInput, "You're already signed in. To leave, tap Sign out on your name in the In the HQ now list.");
      } else if (person) {
        name = person.name;
        detail = person.member ? "Member" : "PUP student, not a member";
      } else {
        // First visit with a student number: a new person row is needed
        newFields.hidden = false;
        var first = document.getElementById("n_first_name");
        var last = document.getElementById("n_last_name");
        var contact = document.getElementById("n_contact_number");
        [first, last, contact].forEach(function (input) {
          if (!fieldError(input, input.value.trim() ? "" : "Needed the first time you sign in.")) ok = false;
        });
        name = first.value.trim() + " " + last.value.trim();
        detail = "PUP student, first visit";
      }
    }

    if (!purpose) {
      purposeBox.setAttribute("aria-invalid", "true");
      document.getElementById("purpose-error").hidden = false;
      ok = false;
    } else {
      purposeBox.removeAttribute("aria-invalid");
      document.getElementById("purpose-error").hidden = true;
    }

    if (!ok) {
      var firstBad = signIn.querySelector('[aria-invalid="true"] input, input[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var purposeName = purpose.getAttribute("data-name");
    var time = nowTime();
    addInside(name, detail, purposeName, time, visitor ? "" : idInput.value.trim().toUpperCase());
    say(kioskMsg, "<strong>Signed in: " + esc(name) + "</strong>, " + esc(purposeName) + ", " + time +
      ". Sign out on the list when you leave.", "ok");
    signIn.reset();
    found.hidden = true;
    newFields.hidden = true;
    visitorFields.hidden = true;
    memberFields.hidden = false;
    kioskMsg.focus();
  });
}

/* ---------- Door kiosk: who is inside, sign out with undo ---------- */
var insideList = document.getElementById("inside-list");
var lastSignedOut = null;

// Add a person to the "In the HQ now" list (a new attendance row, time_out NULL)
function addInside(name, detail, purpose, time, sid) {
  var li = document.createElement("li");
  li.setAttribute("data-name", name.toLowerCase());
  if (sid) li.setAttribute("data-sid", sid);
  li.innerHTML = '<div><span class="who">' + esc(name) + '</span><span class="sub">' + esc(detail) + ", " +
    esc(purpose) + ", in since " + time + '</span></div><button class="btn" type="button" data-signout>Sign out<span class="visually-hidden"> ' +
    esc(name) + "</span></button>";
  insideList.prepend(li);
  updateCount();
}

function updateCount() {
  var n = insideList.querySelectorAll("li:not([hidden])").length;
  document.querySelectorAll("[data-inside-count]").forEach(function (el) { el.textContent = n; });
  document.getElementById("inside-empty").hidden = n > 0;
}

if (insideList) {
  var outMsg = document.getElementById("signout-msg");

  insideList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-signout]");
    if (!btn) return;
    var li = btn.closest("li");
    var name = li.querySelector(".who").textContent;
    li.hidden = true;                       // the PHP version sets attendance.time_out = NOW()
    li.setAttribute("data-out", "yes");
    lastSignedOut = li;
    updateCount();
    say(outMsg, "<strong>" + esc(name) + " signed out at " + nowTime() +
      '.</strong> <button class="btn btn-quiet" type="button" id="undo-out">Undo</button>', "ok");
    document.getElementById("undo-out").focus();
  });

  // Undo the last sign out (wrong name tapped)
  document.addEventListener("click", function (e) {
    if (e.target.id !== "undo-out" || !lastSignedOut) return;
    lastSignedOut.hidden = false;
    lastSignedOut.removeAttribute("data-out");
    say(outMsg, lastSignedOut.querySelector(".who").textContent + " is back on the list.", "ok");
    lastSignedOut.querySelector("button").focus();
    lastSignedOut = null;
    updateCount();
  });

  // Find your own name in a long list
  document.getElementById("find-name").addEventListener("input", function (e) {
    var q = e.target.value.trim().toLowerCase();
    insideList.querySelectorAll("li").forEach(function (li) {
      if (li.hasAttribute("data-out")) return;
      li.hidden = q !== "" && li.getAttribute("data-name").indexOf(q) === -1;
    });
    var shown = insideList.querySelectorAll("li:not([hidden])").length;
    document.getElementById("inside-empty").hidden = shown > 0;
  });
}

/* ---------- Table filters (attendance, people, items) ----------
   Each row carries data-* values; each filter control names the
   attribute it checks with data-filter. */
document.querySelectorAll("[data-filters]").forEach(function (form) {
  var table = document.getElementById(form.getAttribute("data-filters"));
  var empty = document.getElementById(form.getAttribute("data-filters") + "-empty");

  function apply() {
    var shown = 0;
    table.querySelectorAll("tbody tr").forEach(function (row) {
      var keep = true;
      form.querySelectorAll("[data-filter]").forEach(function (ctl) {
        var attr = ctl.getAttribute("data-filter");
        var value = row.getAttribute("data-" + attr) || "";
        if (ctl.type === "checkbox") {
          if (ctl.checked && value !== "yes") keep = false;
        } else if (ctl.type === "search") {
          if (ctl.value && value.indexOf(ctl.value.trim().toLowerCase()) === -1) keep = false;
        } else if (ctl.value && value !== ctl.value) {
          keep = false;
        }
      });
      row.hidden = !keep;
      if (keep) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  form.addEventListener("input", apply);
  form.addEventListener("change", apply);
  form.addEventListener("reset", function () { setTimeout(apply, 0); });
  apply();
});

// Export stub on the attendance page
var exportBtn = document.getElementById("export-btn");
if (exportBtn) {
  exportBtn.addEventListener("click", function () {
    say(document.getElementById("export-msg"),
      "Export is a stub in this prototype. The PHP version downloads the filtered rows as attendance.csv.", "ok");
  });
}

/* ---------- People: add a person, optionally as a member ---------- */
var personForm = document.getElementById("person-form");
if (personForm) {
  var makeMember = document.getElementById("make_member");
  makeMember.addEventListener("change", function () {
    document.getElementById("member-only").hidden = !makeMember.checked;
  });

  personForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var sid = document.getElementById("p_student_id");
    var ok = true;
    ["p_first_name", "p_last_name", "p_contact_number"].forEach(function (id) {
      var input = document.getElementById(id);
      if (!fieldError(input, input.value.trim() ? "" : "Required.")) ok = false;
    });
    // Same rule as trg_member_requires_student_id_ins
    if (!fieldError(sid, makeMember.checked && !sid.value.trim() ? "A club member must have a student ID. Visitors without one can't be members." : "")) ok = false;
    if (!ok) { personForm.querySelector('[aria-invalid="true"]').focus(); return; }

    var tbody = document.querySelector("#people-table tbody");
    var row = document.createElement("tr");
    var name = document.getElementById("p_first_name").value.trim() + " " + document.getElementById("p_last_name").value.trim();
    var role = makeMember.checked ? document.getElementById("p_role_id").selectedOptions[0].text : "";
    row.setAttribute("data-search", (name + " " + sid.value).toLowerCase());
    row.setAttribute("data-kind", makeMember.checked ? "member" : "visitor");
    row.innerHTML =
      '<td data-label="person_id" class="id">new</td>' +
      '<td data-label="Name"><strong>' + esc(name) + '</strong><span class="sub">' + esc(document.getElementById("p_affiliation").value.trim() || "No affiliation") + "</span></td>" +
      '<td data-label="student_id">' + (esc(sid.value.trim()) || '<span class="tag tag-off">None</span>') + "</td>" +
      '<td data-label="contact_number">' + esc(document.getElementById("p_contact_number").value.trim()) + "</td>" +
      '<td data-label="Role">' + (role ? esc(role) : "Visitor, no member row") + "</td>" +
      '<td data-label="is_active">' + (makeMember.checked ? '<span class="tag tag-ok">Active</span>' : "") + "</td>" +
      '<td class="actions"></td>';
    tbody.prepend(row);
    say(document.getElementById("person-msg"), "<strong>" + esc(name) + "</strong> added" + (role ? " as " + esc(role) : " as a visitor") + ".", "ok");
    personForm.reset();
    document.getElementById("member-only").hidden = true;
  });
}

// Activate / deactivate a member (member.is_active)
document.addEventListener("click", function (e) {
  var btn = e.target.closest("[data-toggle-active]");
  if (!btn) return;
  var row = btn.closest("tr");
  var cell = row.querySelector(".active-cell");
  var nowActive = btn.getAttribute("data-toggle-active") !== "true";
  btn.setAttribute("data-toggle-active", nowActive ? "true" : "false");
  cell.innerHTML = nowActive ? '<span class="tag tag-ok">Active</span>' : '<span class="tag tag-off">Inactive</span>';
  btn.innerHTML = (nowActive ? "Deactivate" : "Activate") + '<span class="visually-hidden"> ' + esc(row.querySelector("strong").textContent) + "</span>";
});

/* ---------- Items: add/edit an item, restock a consumable ---------- */
var itemForm = document.getElementById("item-form");
if (itemForm) {
  var editing = null;   // the row being edited, or null when adding

  // Fill the form from a row's data-* values to edit it
  document.getElementById("items-table").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-edit]");
    if (!btn) return;
    editing = btn.closest("tr");
    document.getElementById("i_name").value = editing.getAttribute("data-name-raw");
    document.getElementById("i_category_id").value = editing.getAttribute("data-category");
    document.getElementById(editing.getAttribute("data-type") === "tool" ? "type-tool" : "type-consumable").checked = true;
    document.getElementById("i_quantity_total").value = editing.getAttribute("data-total");
    document.getElementById("i_reorder_level").value = editing.getAttribute("data-reorder");
    document.getElementById("i_is_active").checked = editing.getAttribute("data-active") === "1";
    document.getElementById("item-form-title").textContent = "Edit item #" + editing.getAttribute("data-id");
    document.getElementById("item-cancel").hidden = false;
    document.getElementById("i_name").focus();
  });

  document.getElementById("item-cancel").addEventListener("click", function () {
    editing = null;
    itemForm.reset();
    document.getElementById("item-form-title").textContent = "Add item";
    this.hidden = true;
  });

  itemForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var nameIn = document.getElementById("i_name");
    var totalIn = document.getElementById("i_quantity_total");
    var type = itemForm.querySelector('input[name="item_type"]:checked');
    var ok = fieldError(nameIn, nameIn.value.trim() ? "" : "Give the item a short, specific name.");
    // uq_item_name: names are unique
    var clash = Array.prototype.some.call(document.querySelectorAll("#items-table tbody tr"), function (row) {
      return row !== editing && row.getAttribute("data-name-raw").toLowerCase() === nameIn.value.trim().toLowerCase();
    });
    if (ok && clash) ok = fieldError(nameIn, "An item with this name already exists.");
    if (!fieldError(totalIn, totalIn.value === "" || Number(totalIn.value) < 0 ? "Enter 0 or more." : "")) ok = false;
    if (!type) { document.getElementById("type-error").hidden = false; ok = false; } else { document.getElementById("type-error").hidden = true; }
    if (!ok) return;

    var verb = editing ? "Saved" : "Added";
    say(document.getElementById("item-msg"), "<strong>" + verb + ": " + esc(nameIn.value.trim()) + "</strong> (" + type.value +
      ", total " + totalIn.value + "). The PHP version saves it to the item table.", "ok");
    if (editing) {
      editing.querySelector("strong").textContent = nameIn.value.trim();
      editing.setAttribute("data-name-raw", nameIn.value.trim());
    }
    editing = null;
    itemForm.reset();
    document.getElementById("item-form-title").textContent = "Add item";
    document.getElementById("item-cancel").hidden = true;
  });

  // Restock adds to quantity_available and clears the low flag when above reorder_level
  var restockForm = document.getElementById("restock-form");
  restockForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var itemSel = document.getElementById("r_item_id");
    var qty = document.getElementById("r_quantity");
    var ok = fieldError(itemSel, itemSel.value ? "" : "Pick the consumable you restocked.");
    if (!fieldError(qty, Number(qty.value) > 0 ? "" : "Quantity must be more than 0 (chk_restock_qty).")) ok = false;
    if (!ok) return;

    var row = document.querySelector('#items-table tr[data-id="' + itemSel.value + '"]');
    var avail = Number(row.getAttribute("data-available")) + Number(qty.value);
    var reorder = Number(row.getAttribute("data-reorder"));
    row.setAttribute("data-available", avail);
    row.querySelector(".avail").textContent = avail;
    var low = avail <= reorder;
    row.setAttribute("data-low", low ? "yes" : "no");
    row.classList.toggle("row-alert", low);
    row.querySelector(".stock-cell").innerHTML = low ? '<span class="tag tag-alert">Low stock</span>' : '<span class="tag tag-ok">OK</span>';
    say(document.getElementById("restock-msg"), "<strong>Restocked " + esc(row.getAttribute("data-name-raw")) + "</strong>: +" +
      qty.value + ", now " + avail + " available" + (low ? ", still at or below the reorder level." : "."), "ok");
    itemSel.selectedOptions[0].textContent = row.getAttribute("data-name-raw") + " (" + avail + " left" + (low ? ", low)" : ")");
    restockForm.reset();
  });
}

/* ---------- Requests: approve (stock check + confirm), reject, return ---------- */
var pendingBox = document.getElementById("pending");
if (pendingBox) {
  var reqMsg = document.getElementById("requests-msg");

  // quantity_available per item_id, as v_item_stock would return it
  var STOCK = {};
  document.querySelectorAll("#stock-data li").forEach(function (li) {
    STOCK[li.getAttribute("data-item")] = Number(li.getAttribute("data-available"));
  });

  // Lines that ask for more than is available right now
  function shortLines(req) {
    var short = [];
    req.querySelectorAll(".lines li").forEach(function (line) {
      var item = line.getAttribute("data-item");
      var want = Number(line.getAttribute("data-qty"));
      if (want > STOCK[item]) {
        short.push(line.getAttribute("data-name") + ": asked for " + want + ", only " + STOCK[item] + " available");
      }
    });
    return short;
  }

  pendingBox.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var req = btn.closest(".request");
    var action = btn.getAttribute("data-action");
    var id = req.getAttribute("data-id");
    var who = req.getAttribute("data-who");
    var confirmBox = req.querySelector(".confirm");
    var note = req.querySelector(".req-note");

    if (action === "approve") {
      var short = shortLines(req);
      if (short.length) {
        // The database does not block this, so the UI must
        say(note, "<strong>Can't approve #" + id + ". Not enough stock.</strong> " + esc(short.join("; ")) +
          ". Reject it with a remark, or wait for a return or restock.", "alert");
        note.focus();
        return;
      }
      note.hidden = true;
      confirmBox.querySelector("p").innerHTML = "Approve #" + id + " for <strong>" + esc(who) + "</strong>? " + esc(req.getAttribute("data-summary"));
      confirmBox.querySelector(".remarks-field").hidden = true;
      confirmBox.querySelector("[data-action='confirm']").textContent = "Yes, approve #" + id;
      confirmBox.setAttribute("data-mode", "approve");
      confirmBox.hidden = false;
      confirmBox.querySelector("[data-action='confirm']").focus();
    }

    if (action === "reject") {
      note.hidden = true;
      confirmBox.querySelector("p").innerHTML = "Reject #" + id + " for <strong>" + esc(who) + "</strong>? Tell them why.";
      confirmBox.querySelector(".remarks-field").hidden = false;
      confirmBox.querySelector("[data-action='confirm']").textContent = "Yes, reject #" + id;
      confirmBox.setAttribute("data-mode", "reject");
      confirmBox.hidden = false;
      confirmBox.querySelector("textarea").focus();
    }

    if (action === "cancel") {
      confirmBox.hidden = true;
      req.querySelector("[data-action='approve']").focus();
    }

    if (action === "confirm") {
      var mode = confirmBox.getAttribute("data-mode");
      var remarks = confirmBox.querySelector("textarea");
      if (mode === "reject" && !fieldError(remarks, remarks.value.trim() ? "" : "Add a remark so the member knows why.")) {
        remarks.focus();
        return;
      }
      if (mode === "approve") {
        // Take the approved quantities out of stock so the next check uses them
        req.querySelectorAll(".lines li").forEach(function (line) {
          STOCK[line.getAttribute("data-item")] -= Number(line.getAttribute("data-qty"));
        });
      }
      req.remove();
      document.getElementById("pending-count").textContent = pendingBox.querySelectorAll(".request").length;
      say(reqMsg, "<strong>#" + id + " " + (mode === "approve" ? "approved" : "rejected") + "</strong> for " + esc(who) +
        " by " + CURRENT_USER + " at " + nowTime() + "." + (mode === "approve" ? " Tools now show under Open loans in the PHP version." : ""), "ok");
      reqMsg.focus();
    }
  });

  // Mark a tool returned (request_line.returned_at = NOW())
  document.getElementById("loans-table").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-return]");
    if (!btn) return;
    var row = btn.closest("tr");
    row.classList.remove("row-alert");
    row.querySelector(".loan-status").innerHTML = '<span class="tag tag-ok">Returned ' + nowTime() + "</span>";
    btn.closest("td").innerHTML = "";
    say(reqMsg, "<strong>" + esc(row.getAttribute("data-item")) + "</strong> marked returned by " + esc(row.getAttribute("data-who")) + ".", "ok");
    reqMsg.focus();
  });
}

/* ---------- Requests: new request form ---------- */
var newReq = document.getElementById("new-request");
if (newReq) {
  var linesBox = document.getElementById("req-lines");
  var lineCount = 1;

  // Due date only applies to tools; consumables are not returned
  function syncDue(line) {
    var sel = line.querySelector("select");
    var opt = sel.selectedOptions[0];
    var isTool = opt && opt.getAttribute("data-type") === "tool";
    line.querySelector(".due-field").hidden = !isTool;
    line.querySelector(".no-due").hidden = isTool || !sel.value;
  }

  linesBox.addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT") syncDue(e.target.closest(".req-line"));
  });

  document.getElementById("add-line").addEventListener("click", function () {
    var first = linesBox.querySelector(".req-line");
    var copy = first.cloneNode(true);
    lineCount++;
    // give every control in the copy its own id so labels still match
    copy.querySelectorAll("[id]").forEach(function (el) { el.id = el.id.replace(/-\d+$/, "") + "-" + lineCount; });
    copy.querySelectorAll("[for]").forEach(function (el) { el.setAttribute("for", el.getAttribute("for").replace(/-\d+$/, "") + "-" + lineCount); });
    copy.querySelectorAll("select, input").forEach(function (el) { el.value = el.type === "number" ? "1" : ""; el.removeAttribute("aria-invalid"); });
    copy.querySelectorAll(".error").forEach(function (el) { el.hidden = true; });
    copy.querySelector(".remove").hidden = false;
    linesBox.appendChild(copy);
    syncDue(copy);
    copy.querySelector("select").focus();
  });

  linesBox.addEventListener("click", function (e) {
    if (!e.target.closest(".remove")) return;
    e.target.closest(".req-line").remove();
    document.getElementById("add-line").focus();
  });

  newReq.addEventListener("submit", function (e) {
    e.preventDefault();
    var member = document.getElementById("requested_by");
    var ok = fieldError(member, member.value ? "" : "Choose who is asking.");
    var seen = {};
    linesBox.querySelectorAll(".req-line").forEach(function (line) {
      var sel = line.querySelector("select");
      var qty = line.querySelector('input[type="number"]');
      var due = line.querySelector('input[type="date"]');
      var msg = "";
      if (!sel.value) msg = "Pick an item.";
      else if (seen[sel.value]) msg = "This item is already on the request. Change the quantity instead.";
      if (!fieldError(sel, msg)) ok = false;
      seen[sel.value] = true;
      if (!fieldError(qty, Number(qty.value) > 0 ? "" : "At least 1.")) ok = false;
      if (!line.querySelector(".due-field").hidden && !fieldError(due, due.value ? "" : "Tools need a due date.")) ok = false;
    });
    if (!ok) { newReq.querySelector('[aria-invalid="true"]').focus(); return; }
    say(document.getElementById("new-request-msg"), "<strong>Request sent for " + esc(member.selectedOptions[0].text) +
      ".</strong> It waits under Pending until an officer decides it. Stock is checked again at approval.", "ok");
    newReq.reset();
    linesBox.querySelectorAll(".req-line").forEach(function (line, i) { if (i > 0) line.remove(); else syncDue(line); });
  });
}

/* ---------- Settings: add a role, purpose or category ---------- */
document.querySelectorAll("[data-lookup]").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = form.querySelector("input[type='text']");
    var list = document.getElementById(form.getAttribute("data-lookup"));
    var name = input.value.trim();
    var taken = Array.prototype.some.call(list.querySelectorAll("[data-name]"), function (el) {
      return el.getAttribute("data-name").toLowerCase() === name.toLowerCase();
    });
    if (!fieldError(input, !name ? "Type a name." : taken ? "Already in the list (names are unique)." : "")) { input.focus(); return; }
    var row = document.createElement("tr");
    row.setAttribute("data-name", name);
    row.innerHTML = '<td class="id">new</td><td>' + esc(name) + "</td>";
    if (form.hasAttribute("data-with-approve")) {
      var can = form.querySelector("input[type='checkbox']").checked;
      row.innerHTML += "<td>" + (can ? '<span class="tag tag-ok">Can approve</span>' : '<span class="tag tag-off">Cannot approve</span>') + "</td>";
    }
    list.querySelector("tbody").appendChild(row);
    say(form.parentNode.querySelector(".msg-slot"), "<strong>" + esc(name) + "</strong> added.", "ok");
    form.reset();
  });
});
