/* =========================================================
   Hygears HQ System - shared script for all 8 pages
   Plain functions, no libraries. In the prototype it only
   changes what is on screen; in the PHP rebuild each form
   posts to the server and the same checks run again there.
   ========================================================= */

document.documentElement.className = "js";

/* ---------- Small helpers ---------- */

// Today's date in the sample data (the PHP version uses CURDATE()).
var TODAY = "2026-11-23";

// Current time as HH:MM for time_in / time_out stamps.
function nowTime() {
  var d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Escape text typed by a user before putting it in HTML (PHP: htmlspecialchars).
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Show an error under one field and mark the field invalid.
function setError(input, text) {
  var box = document.getElementById(input.id + "-msg");
  input.setAttribute("aria-invalid", "true");
  if (box) box.innerHTML = '<p class="error">' + text + "</p>";
}

function clearError(input) {
  var box = document.getElementById(input.id + "-msg");
  input.removeAttribute("aria-invalid");
  if (box) box.innerHTML = "";
}

// Feedback box after an action. type: "ok" or "error".
function showMsg(box, html, type) {
  box.innerHTML = '<div class="msg' + (type === "error" ? " msg-error" : "") + '" tabindex="-1">' + html + "</div>";
  box.firstChild.focus();
}

// Inline "Are you sure?" step so one stray tap never approves, rejects or returns anything.
// host: where the question appears. hideEl: the buttons it replaces while open.
function askConfirm(host, hideEl, question, yesLabel, onYes, extraHtml) {
  var old = host.querySelector(".confirm");
  if (old) old.remove();
  var box = document.createElement("div");
  box.className = "confirm";
  box.setAttribute("tabindex", "-1");
  box.innerHTML = "<p>" + question + "</p>" + (extraHtml || "") +
    '<div class="actions"><button type="button" class="btn btn-primary" data-yes>' + yesLabel + "</button>" +
    '<button type="button" class="btn" data-no>Cancel</button></div>';
  hideEl.hidden = true;
  host.appendChild(box);
  box.focus();
  box.querySelector("[data-no]").onclick = function () {
    box.remove();
    hideEl.hidden = false;
    hideEl.querySelector("button").focus();
  };
  box.querySelector("[data-yes]").onclick = function () {
    onYes(box);
    box.remove();
  };
}

// Show only the table rows that pass the test; update the count and the empty note.
function filterRows(table, test, countEl, emptyEl) {
  var shown = 0;
  table.querySelectorAll("tbody tr").forEach(function (row) {
    var ok = test(row);
    row.hidden = !ok;
    if (ok) shown++;
  });
  if (countEl) countEl.textContent = shown;
  if (emptyEl) emptyEl.hidden = shown > 0;
}

/* ---------- Menu button (all pages, under 1024px) ---------- */
var menuBtn = document.querySelector(".menu-btn");
if (menuBtn) {
  menuBtn.addEventListener("click", function () {
    var nav = document.getElementById("nav");
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.textContent = open ? "Close" : "Menu";
  });
}

/* =========================================================
   Kiosk (index.html): sign in and sign out
   ========================================================= */

// Sample lookup of person by student_id. PHP: SELECT ... FROM person WHERE student_id = ?
var PEOPLE = {
  "2022-00141-MN-0": { name: "Mika Santos", first: "Mika" },
  "2021-00317-MN-0": { name: "Paolo Reyes", first: "Paolo" },
  "2021-00088-MN-0": { name: "Andrea Cruz", first: "Andrea" },
  "2023-00452-MN-0": { name: "Jun Bautista", first: "Jun" },
  "2022-00219-MN-0": { name: "Bea Lim", first: "Bea" },
  "2023-01120-MN-0": { name: "Rina Torres", first: "Rina" }
};

var signinForm = document.getElementById("signin-form");
var kioskMode = "member";
var resetTimer = null;

if (signinForm) {
  // Live clock in the kiosk corner
  var clock = document.getElementById("clock");
  clock.textContent = nowTime();
  setInterval(function () { clock.textContent = nowTime(); }, 15000);

  var sidInput = document.getElementById("student_id");

  // Name appears as soon as a known student number is typed
  sidInput.addEventListener("input", function () {
    clearError(sidInput);
    var person = PEOPLE[sidInput.value.trim().toUpperCase()];
    if (person) {
      document.getElementById("student_id-msg").innerHTML = '<p class="found">' + person.name + "</p>";
    }
  });

  // Student number / Visitor switch
  document.querySelectorAll('[data-action="mode"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      kioskMode = btn.dataset.mode;
      document.querySelectorAll('[data-action="mode"]').forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      document.getElementById("member-fields").hidden = kioskMode !== "member";
      document.getElementById("visitor-fields").hidden = kioskMode !== "visitor";
    });
  });

  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var who, first, sid = "", isVisitor = kioskMode === "visitor";
    var purpose = signinForm.querySelector('input[name="purpose_id"]:checked');
    var purposeMsg = document.getElementById("purpose-msg");
    purposeMsg.innerHTML = purpose ? "" : '<p class="error">Choose why you are here.</p>';
    if (!purpose) ok = false;

    if (!isVisitor) {
      sid = sidInput.value.trim().toUpperCase();
      var person = PEOPLE[sid];
      if (sid === "") {
        setError(sidInput, "Type your student number.");
        ok = false;
      } else if (!person) {
        setError(sidInput, "No one with student number " + escapeHtml(sid) + " is in the log yet. Tap Visitor above to sign in with your name, and ask an officer to add you.");
        ok = false;
      } else {
        // Already inside? A second open row would break the log.
        var open = document.querySelector('#inside-list li[data-sid="' + sid + '"]');
        if (open) {
          setError(sidInput, person.name + " is already signed in since " + open.dataset.in + ". To leave, tap Sign out next to your name.");
          ok = false;
        }
        who = person.name;
        first = person.first;
      }
    } else {
      ["first_name", "last_name", "contact_number"].forEach(function (id) {
        var input = document.getElementById(id);
        clearError(input);
        if (input.value.trim() === "") {
          setError(input, "Required.");
          ok = false;
        }
      });
      var contact = document.getElementById("contact_number");
      if (contact.value.trim() !== "" && contact.value.replace(/\D/g, "").length < 7) {
        setError(contact, "Use at least 7 digits, for example 0900 000 0000.");
        ok = false;
      }
      first = document.getElementById("first_name").value.trim();
      who = first + " " + document.getElementById("last_name").value.trim();
    }

    if (!ok) {
      var firstBad = signinForm.querySelector('[aria-invalid="true"]') || signinForm.querySelector('input[name="purpose_id"]');
      firstBad.focus();
      return;
    }

    // INSERT INTO attendance (person_id, purpose_id, time_in) VALUES (?, ?, NOW())
    var purposeName = purpose.nextElementSibling.textContent;
    var time = nowTime();
    addInside(who, sid, purposeName, time, isVisitor);
    showDone("Signed in. Welcome, " + escapeHtml(first) + ".", "Time in " + time, escapeHtml(purposeName));
  });

  // Find your name in the list
  document.getElementById("find-me").addEventListener("input", function () {
    var q = this.value.trim().toLowerCase();
    var shown = 0;
    document.querySelectorAll("#inside-list li").forEach(function (li) {
      var ok = li.dataset.name.toLowerCase().indexOf(q) !== -1;
      li.hidden = !ok;
      if (ok) shown++;
    });
    document.getElementById("inside-empty").hidden = shown > 0;
  });

  // Sign out: ask first, then close the attendance row
  document.getElementById("inside-list").addEventListener("click", function (e) {
    var btn = e.target.closest('[data-action="ask-out"]');
    if (!btn) return;
    var li = btn.closest("li");
    var row = li.querySelector(".inside-row");
    askConfirm(li, row, "Sign out <strong>" + escapeHtml(li.dataset.name) + "</strong>?", "Yes, sign out", function () {
      // UPDATE attendance SET time_out = NOW() WHERE attendance_id = ?
      var time = nowTime();
      var first = li.dataset.name.split(" ")[0];
      li.remove();
      updateInsideCount();
      showDone("Signed out. See you, " + escapeHtml(first) + ".", "Time out " + time, "In since " + li.dataset.in);
    });
  });

  document.querySelector('[data-action="done"]').addEventListener("click", resetKiosk);
}

// Add a person to "In the HQ now"
function addInside(name, sid, purposeName, time, isVisitor) {
  var li = document.createElement("li");
  li.dataset.sid = sid;
  li.dataset.name = name;
  li.dataset.in = time;
  li.innerHTML = '<div class="inside-row"><div class="who-in"><span class="name">' + escapeHtml(name) +
    (isVisitor ? ' <span class="tag">visitor</span>' : "") + '</span><span class="meta">' + escapeHtml(purposeName) +
    ' &middot; in since <span class="mono">' + time + '</span></span></div>' +
    '<button class="btn" type="button" data-action="ask-out">Sign out</button></div>';
  document.getElementById("inside-list").appendChild(li);
  updateInsideCount();
}

function updateInsideCount() {
  document.getElementById("inside-count").textContent = document.querySelectorAll("#inside-list li").length;
}

// Big confirmation, then the kiosk resets itself for the next person
function showDone(title, time, detail) {
  var done = document.getElementById("done");
  document.getElementById("signin-box").hidden = true;
  document.getElementById("done-title").innerHTML = title;
  document.getElementById("done-time").textContent = time;
  document.getElementById("done-detail").innerHTML = detail;
  done.hidden = false;
  done.scrollIntoView({ block: "start" });
  done.focus();
  var left = 8;
  var note = document.getElementById("done-reset");
  note.textContent = "This screen resets in " + left + " seconds.";
  clearInterval(resetTimer);
  resetTimer = setInterval(function () {
    left--;
    note.textContent = "This screen resets in " + left + " seconds.";
    if (left <= 0) resetKiosk();
  }, 1000);
}

function resetKiosk() {
  clearInterval(resetTimer);
  signinForm.reset();
  signinForm.querySelectorAll("[aria-invalid]").forEach(clearError);
  document.getElementById("student_id-msg").innerHTML = "";
  document.getElementById("purpose-msg").innerHTML = "";
  document.getElementById("done").hidden = true;
  document.getElementById("signin-box").hidden = false;
  window.scrollTo(0, 0);
  // Back to the student number box for the next person (visitor mode stays if chosen)
  var target = kioskMode === "member" ? document.getElementById("student_id") : document.getElementById("first_name");
  target.focus();
}

/* =========================================================
   Attendance log filters (attendance.html)
   ========================================================= */
var logTable = document.getElementById("log");
if (logTable) {
  var runLogFilter = function () {
    var date = document.getElementById("f-date").value;
    var purpose = document.getElementById("f-purpose").value;
    var who = document.getElementById("f-who").value;
    var inside = document.getElementById("f-inside").checked;
    filterRows(logTable, function (row) {
      return (!date || row.dataset.date === date) &&
        (!purpose || row.dataset.purpose === purpose) &&
        (!who || row.dataset.who === who) &&
        (!inside || row.dataset.inside === "1");
    }, document.getElementById("log-count"), document.getElementById("log-empty"));
  };
  var logFilters = document.getElementById("log-filters");
  logFilters.addEventListener("input", runLogFilter);
  logFilters.addEventListener("change", runLogFilter);
  // Clear filters shows every date, not just today
  logFilters.addEventListener("reset", function () {
    setTimeout(function () { document.getElementById("f-date").value = ""; runLogFilter(); }, 0);
  });
  runLogFilter();

  document.querySelector('[data-action="export"]').addEventListener("click", function () {
    showMsg(document.getElementById("export-msg"),
      "<p>Export is not wired up in the prototype. In PHP this button downloads the filtered rows as <code>attendance.csv</code>.</p>", "ok");
  });
}

/* =========================================================
   People (people.html)
   ========================================================= */
var peopleTable = document.getElementById("people");
if (peopleTable) {
  var runPeopleFilter = function () {
    var q = document.getElementById("p-search").value.trim().toLowerCase();
    var kind = document.getElementById("p-kind").value;
    filterRows(peopleTable, function (row) {
      var kindOk = !kind || row.dataset.kind === kind || (kind === "member" && row.dataset.kind === "inactive");
      return kindOk && row.textContent.toLowerCase().indexOf(q) !== -1;
    }, document.getElementById("people-count"), document.getElementById("people-empty"));
  };
  document.getElementById("p-search").addEventListener("input", runPeopleFilter);
  document.getElementById("p-kind").addEventListener("change", runPeopleFilter);

  // Add a person: INSERT INTO person
  document.getElementById("person-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    ["np-first", "np-last", "np-contact"].forEach(function (id) {
      var input = document.getElementById(id);
      clearError(input);
      if (input.value.trim() === "") { setError(input, "Required."); ok = false; }
    });
    var sid = document.getElementById("np-sid");
    clearError(sid);
    var sidVal = sid.value.trim().toUpperCase();
    // uq_person_student_id: one person per student number
    if (sidVal && peopleTable.textContent.indexOf(sidVal) !== -1) {
      setError(sid, "That student number already belongs to someone in the list.");
      ok = false;
    }
    if (!ok) { this.querySelector('[aria-invalid="true"]').focus(); return; }

    var name = document.getElementById("np-first").value.trim() + " " + document.getElementById("np-last").value.trim();
    var aff = document.getElementById("np-aff").value.trim();
    var id = peopleTable.querySelectorAll("tbody tr").length + 1;
    var row = document.createElement("tr");
    row.dataset.kind = "visitor";
    row.innerHTML = '<td class="id" data-label="person_id">' + id + '</td><td class="lead" data-label="Name">' + escapeHtml(name) +
      (aff ? '<span class="sub">' + escapeHtml(aff) + "</span>" : "") + '</td><td class="mono" data-label="student_id">' + (sidVal ? escapeHtml(sidVal) : "&ndash;") +
      '</td><td class="mono" data-label="contact_number">' + escapeHtml(document.getElementById("np-contact").value.trim()) +
      '</td><td data-label="Role">Not a member</td><td class="mono" data-label="joined_on">&ndash;</td><td data-label="is_active">&ndash;</td>';
    peopleTable.querySelector("tbody").appendChild(row);
    // The new person can now be made a member
    var opt = document.createElement("option");
    opt.value = id;
    opt.dataset.sid = sidVal;
    opt.textContent = name + (sidVal ? ", " + sidVal : " (no student number)");
    document.getElementById("m-person").appendChild(opt);
    runPeopleFilter();
    this.reset();
    showMsg(document.getElementById("person-result"), "<p><strong>Saved " + escapeHtml(name) + "</strong> as person #" + id + ". Not a member yet.</p>", "ok");
  });

  // Make a member: INSERT INTO member (blocked without a student number, like the trigger)
  document.getElementById("member-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var sel = document.getElementById("m-person");
    clearError(sel);
    var opt = sel.options[sel.selectedIndex];
    if (!sel.value) {
      setError(sel, "Choose a person.");
    } else if (sel.value === "6") {
      setError(sel, "Lara Mendoza is already a member. Change her role or active status instead.");
    } else if (!opt.dataset.sid) {
      setError(sel, opt.textContent.split(" (")[0] + " has no student number. A member must have one, so add it first or keep them as a visitor.");
    } else {
      var role = document.getElementById("m-role");
      showMsg(document.getElementById("member-result"), "<p><strong>" + escapeHtml(opt.textContent.split(",")[0]) + " is now a member</strong>, role " +
        escapeHtml(role.options[role.selectedIndex].text.split(" (")[0]) + ".</p>", "ok");
      return;
    }
    sel.focus();
  });
}

/* =========================================================
   Inventory (items.html)
   ========================================================= */
var itemsTable = document.getElementById("items");
if (itemsTable) {
  var runItemFilter = function () {
    var q = document.getElementById("i-search").value.trim().toLowerCase();
    var cat = document.getElementById("i-cat").value;
    var type = document.getElementById("i-type").value;
    var low = document.getElementById("i-low").checked;
    filterRows(itemsTable, function (row) {
      return row.querySelector(".iname").textContent.toLowerCase().indexOf(q) !== -1 &&
        (!cat || row.dataset.cat === cat) &&
        (!type || row.dataset.type === type) &&
        (!low || row.classList.contains("flag"));
    }, document.getElementById("item-count"), document.getElementById("items-empty"));
  };
  ["i-search", "i-cat", "i-type", "i-low"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", runItemFilter);
    document.getElementById(id).addEventListener("change", runItemFilter);
  });
  // The dashboard links here with ?low=1
  if (location.search.indexOf("low=1") !== -1) {
    document.getElementById("i-low").checked = true;
    runItemFilter();
  }

  var itemForm = document.getElementById("item-form");

  // Edit: copy the row into the form and switch it to UPDATE
  itemsTable.addEventListener("click", function (e) {
    if (!e.target.closest('[data-action="edit-item"]')) return;
    var row = e.target.closest("tr");
    var d = row.dataset;
    document.getElementById("it-id").value = d.id;
    document.getElementById("it-name").value = row.querySelector(".iname").textContent;
    var cat = document.getElementById("it-cat");
    for (var i = 0; i < cat.options.length; i++) if (cat.options[i].text === d.cat) cat.selectedIndex = i;
    itemForm.querySelector('input[name="item_type"][value="' + d.type + '"]').checked = true;
    document.getElementById("it-total").value = d.total;
    document.getElementById("it-reorder").value = d.reorder;
    document.getElementById("it-active").checked = d.active === "1";
    document.getElementById("item-form-title").textContent = "Edit item #" + d.id;
    document.getElementById("item-form-sql").textContent = "UPDATE item WHERE item_id = " + d.id;
    document.getElementById("item-submit").textContent = "Save changes";
    document.getElementById("cancel-edit").hidden = false;
    document.getElementById("item-form-panel").scrollIntoView({ block: "start" });
    document.getElementById("it-name").focus();
  });

  var resetItemForm = function () {
    itemForm.reset();
    document.getElementById("it-id").value = "";
    document.getElementById("item-form-title").textContent = "Add an item";
    document.getElementById("item-form-sql").textContent = "INSERT INTO item";
    document.getElementById("item-submit").textContent = "Save item";
    document.getElementById("cancel-edit").hidden = true;
  };
  document.getElementById("cancel-edit").addEventListener("click", resetItemForm);

  itemForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("it-name");
    var total = document.getElementById("it-total");
    var editing = document.getElementById("it-id").value;
    clearError(name);
    clearError(total);
    var ok = true;
    var taken = false;
    itemsTable.querySelectorAll("tbody tr").forEach(function (row) {
      if (row.dataset.id !== editing && row.querySelector(".iname").textContent.toLowerCase() === name.value.trim().toLowerCase()) taken = true;
    });
    if (name.value.trim() === "") { setError(name, "Give the item a name."); ok = false; }
    else if (taken) { setError(name, "An item with this name already exists (names are unique)."); ok = false; }
    if (total.value === "" || Number(total.value) < 0 || !Number.isInteger(Number(total.value))) {
      setError(total, "Enter a whole number, 0 or more."); ok = false;
    }
    if (!ok) { itemForm.querySelector('[aria-invalid="true"]').focus(); return; }

    var type = itemForm.querySelector('input[name="item_type"]:checked').value;
    var cat = document.getElementById("it-cat");
    var catName = cat.options[cat.selectedIndex].text;
    var reorder = document.getElementById("it-reorder").value;
    var active = document.getElementById("it-active").checked;
    var row;
    if (editing) {
      row = itemsTable.querySelector('tr[data-id="' + editing + '"]');
    } else {
      row = document.createElement("tr");
      row.dataset.id = itemsTable.querySelectorAll("tbody tr").length + 1;
      itemsTable.querySelector("tbody").appendChild(row);
    }
    var avail = editing ? Number(row.querySelector(".avail").textContent) : Number(total.value);
    row.dataset.cat = catName;
    row.dataset.type = type;
    row.dataset.total = total.value;
    row.dataset.reorder = reorder;
    row.dataset.active = active ? "1" : "0";
    var low = active && reorder !== "" && avail <= Number(reorder);
    row.className = low ? "flag" : "";
    row.innerHTML = '<td class="id" data-label="item_id">' + row.dataset.id + '</td><td class="lead" data-label="Item"><span class="iname">' + escapeHtml(name.value.trim()) +
      '</span><span class="sub">' + catName + '</span></td><td data-label="Type">' + (type === "tool" ? "Tool" : "Consumable") +
      '</td><td class="num" data-label="quantity_total">' + total.value + '</td><td class="num avail" data-label="quantity_available">' + avail +
      '</td><td class="num" data-label="reorder_level">' + (reorder || "&ndash;") + '</td><td data-label="Status">' + stockStatus(active, low) +
      '</td><td class="act"><button class="btn" type="button" data-action="edit-item">Edit</button></td>';
    if (!editing && type === "consumable") addRestockOption(row.dataset.id, name.value.trim(), avail, low);
    var verb = editing ? "Updated" : "Added";
    resetItemForm();
    runItemFilter();
    showMsg(document.getElementById("item-result"), "<p><strong>" + verb + " " + escapeHtml(row.querySelector(".iname").textContent) + "</strong> (item #" + row.dataset.id + ").</p>", "ok");
  });

  // Restock: INSERT INTO restock, then v_item_stock goes up by the quantity
  document.getElementById("restock-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var sel = document.getElementById("rs-item");
    var qty = document.getElementById("rs-qty");
    clearError(sel);
    clearError(qty);
    var ok = true;
    if (!sel.value) { setError(sel, "Choose what you restocked."); ok = false; }
    if (!Number.isInteger(Number(qty.value)) || Number(qty.value) < 1) { setError(qty, "Enter a whole number above 0."); ok = false; }
    if (!ok) { this.querySelector('[aria-invalid="true"]').focus(); return; }

    var row = itemsTable.querySelector('tr[data-id="' + sel.value + '"]');
    var name = row.querySelector(".iname").textContent;
    var before = Number(row.querySelector(".avail").textContent);
    var after = before + Number(qty.value);
    var low = row.dataset.reorder !== "" && after <= Number(row.dataset.reorder);
    row.querySelector(".avail").textContent = after;
    row.className = low ? "flag" : "";
    row.querySelector('[data-label="Status"]').innerHTML = stockStatus(true, low);
    sel.options[sel.selectedIndex].textContent = name + " (" + after + " left" + (low ? ", low" : "") + ")";

    var log = document.createElement("tr");
    log.innerHTML = '<td class="lead" data-label="Item">' + escapeHtml(name) + '</td><td class="num" data-label="quantity">' + Number(qty.value) +
      '</td><td class="mono" data-label="restocked_on">' + escapeHtml(document.getElementById("rs-date").value) +
      '</td><td data-label="notes">' + (escapeHtml(document.getElementById("rs-notes").value) || "&ndash;") + "</td>";
    document.getElementById("restock-log").prepend(log);
    this.reset();
    runItemFilter();
    showMsg(document.getElementById("restock-result"), "<p><strong>Restocked " + escapeHtml(name) + ":</strong> " + before + " &rarr; " + after + " available." +
      (low ? " Still at or below the reorder level." : " No longer low.") + "</p>", "ok");
  });
}

function stockStatus(active, low) {
  if (!active) return '<span class="status status-off">Inactive</span>';
  return low ? '<span class="status status-alert">Low stock</span>' : '<span class="status status-ok">In stock</span>';
}

function addRestockOption(id, name, avail, low) {
  var opt = document.createElement("option");
  opt.value = id;
  opt.textContent = name + " (" + avail + " left" + (low ? ", low" : "") + ")";
  document.getElementById("rs-item").appendChild(opt);
}

/* =========================================================
   Requests (requests.html)
   ========================================================= */
var pendingSection = document.getElementById("pending");
if (pendingSection) {
  var ME = "Paolo Reyes"; // the signed-in officer (PHP: from the session)

  // Lines asking for more than v_item_stock.quantity_available
  var shortLines = function (req) {
    var out = [];
    req.querySelectorAll(".lines li").forEach(function (li) {
      var short = Number(li.dataset.qty) > Number(li.dataset.available);
      li.querySelector(".stock").classList.toggle("short", short);
      li.querySelector(".stock").textContent = li.dataset.available + " available" + (short ? ", not enough" : "");
      if (short) out.push(li);
    });
    return out;
  };

  // The database does not block over-approving, so the page does
  var checkRequest = function (req) {
    if (req.dataset.own === "1" || req.dataset.decided) return [];
    var short = shortLines(req);
    var box = req.querySelector(".req-msg");
    req.classList.toggle("blocked", short.length > 0);
    // Still clickable so the reason is repeated, but announced as unavailable
    var approveBtn = req.querySelector('[data-action="approve"]');
    if (approveBtn) approveBtn.setAttribute("aria-disabled", short.length ? "true" : "false");
    if (short.length) {
      var list = short.map(function (li) {
        return "<li>" + li.dataset.name + ": asks for " + li.dataset.qty + ", only " + li.dataset.available + " available</li>";
      }).join("");
      box.innerHTML = '<div class="msg msg-error" tabindex="-1"><p><strong>Not enough stock to approve.</strong></p><ul>' + list +
        "</ul><p>Ask " + req.dataset.requester.split(" ")[0] + " to lower the quantity, wait for a return, or reject with a reason.</p></div>";
    } else {
      box.innerHTML = "";
    }
    return short;
  };

  var updatePendingCount = function () {
    var n = pendingSection.querySelectorAll(".req:not([data-decided])").length;
    document.getElementById("pending-count").textContent = n;
    document.querySelectorAll(".nav .count").forEach(function (c) { c.firstChild.nodeValue = n; });
  };

  // Move stock up or down for an item in every pending card, then re-check them
  var changeStock = function (itemId, delta) {
    pendingSection.querySelectorAll('.lines li[data-item="' + itemId + '"]').forEach(function (li) {
      li.dataset.available = Number(li.dataset.available) + delta;
    });
    pendingSection.querySelectorAll(".req").forEach(checkRequest);
  };

  pendingSection.querySelectorAll(".req").forEach(checkRequest);

  pendingSection.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var req = btn.closest(".req");
    var id = req.dataset.request;
    var actions = req.querySelector(".req-actions");

    if (btn.dataset.action === "approve") {
      if (checkRequest(req).length) {
        req.querySelector(".req-msg .msg").focus();
        return;
      }
      var summary = [];
      req.querySelectorAll(".lines li").forEach(function (li) {
        summary.push(li.dataset.name + " &times;" + li.dataset.qty + (li.dataset.type === "tool" ? " until " + li.dataset.due : ""));
      });
      askConfirm(req, actions, "Approve <strong>#" + id + "</strong> for " + req.dataset.requester + "? Gives out " + summary.join(", ") + ".", "Yes, approve", function () {
        // UPDATE item_request SET status='approved', decided_by=?, decided_at=NOW() WHERE request_id=?
        decide(req, "approved", "");
        req.querySelectorAll(".lines li").forEach(function (li) {
          changeStock(li.dataset.item, -Number(li.dataset.qty));
          if (li.dataset.type === "tool") addLoan(id, li, req.dataset.requester);
        });
      });
    }

    if (btn.dataset.action === "reject") {
      askConfirm(req, actions, "Reject <strong>#" + id + "</strong> from " + req.dataset.requester + "?", "Yes, reject", function (box) {
        decide(req, "rejected", box.querySelector("input").value.trim());
      }, '<div class="field mb"><label for="remarks-' + id + '">Reason <span class="col">remarks</span></label>' +
        '<input id="remarks-' + id + '" type="text" maxlength="255" placeholder="Example: drill is out until Friday"></div>');
    }
  });

  // Turn a pending card into a decided one
  var decide = function (req, status, remarks) {
    req.dataset.decided = status;
    req.classList.remove("blocked");
    req.querySelector(".req-actions").remove();
    var label = status === "approved" ? '<span class="status status-ok">Approved</span>' : '<span class="status status-off">Rejected</span>';
    req.querySelector(".req-head .status").outerHTML = label;
    var text = status === "approved"
      ? "<p><strong>Approved by " + ME + " at " + nowTime() + ".</strong> Tools in this request are now under Tools out on loan.</p>"
      : "<p><strong>Rejected by " + ME + " at " + nowTime() + ".</strong>" + (remarks ? " Reason: " + escapeHtml(remarks) : " No reason given.") + "</p>";
    showMsg(req.querySelector(".req-msg"), text, "ok");
    updatePendingCount();
  };

  // New row in the open loans table after an approval
  var addLoan = function (id, li, who) {
    var row = document.createElement("tr");
    row.dataset.item = li.dataset.item;
    row.dataset.qty = li.dataset.qty;
    row.innerHTML = '<td class="id" data-label="request_id">#' + id + '</td><td class="lead" data-label="Tool">' + li.dataset.name + " &times;" + li.dataset.qty +
      '</td><td data-label="Borrower">' + who + '</td><td class="mono" data-label="due_date">' + li.dataset.due +
      '</td><td data-label="is_overdue"><span class="status status-ok">On time</span></td>' +
      '<td class="act"><button class="btn" type="button" data-action="return">Mark returned</button></td>';
    document.querySelector("#loan-table tbody").appendChild(row);
    updateLoanCount(1);
  };

  var updateLoanCount = function (delta) {
    var el = document.getElementById("loan-count");
    el.textContent = Number(el.textContent) + delta;
  };

  // Mark returned: UPDATE request_line SET returned_at = NOW() WHERE line_id = ?
  document.getElementById("loan-table").addEventListener("click", function (e) {
    var btn = e.target.closest('[data-action="return"]');
    if (!btn) return;
    var row = btn.closest("tr");
    var cell = btn.closest("td");
    var wrap = document.createElement("div");
    cell.appendChild(wrap);
    wrap.appendChild(btn);
    askConfirm(cell, wrap, "Got " + row.querySelector('[data-label="Tool"]').textContent + " back?", "Yes, returned", function () {
      row.classList.remove("flag");
      row.querySelector('[data-label="is_overdue"]').innerHTML = '<span class="status status-done">Returned ' + nowTime() + "</span>";
      wrap.remove();
      changeStock(row.dataset.item, Number(row.dataset.qty));
      updateLoanCount(-1);
      cell.innerHTML = '<span class="hint">Back in the HQ</span>';
    });
  });

  /* ----- New request form ----- */
  var reqForm = document.getElementById("request-form");
  var lineCount = 1;

  // Tools need a due date; consumables can't have one (trg_line_consumable_ins)
  var updateLine = function (line) {
    var opt = line.querySelector(".rl-item").selectedOptions[0];
    var due = line.querySelector(".rl-due");
    var msg = line.querySelector(".rl-msg");
    if (!opt || !opt.value) { due.disabled = false; msg.innerHTML = ""; return; }
    var isTool = opt.dataset.type === "tool";
    due.disabled = !isTool;
    if (!isTool) due.value = "";
    msg.innerHTML = '<p class="hint">' + opt.dataset.available + " available now. " +
      (isTool ? "Tool: return it by the due date." : "Consumable: used up, so no due date.") + "</p>";
  };

  reqForm.addEventListener("change", function (e) {
    if (e.target.classList.contains("rl-item")) updateLine(e.target.closest(".line-row"));
  });

  reqForm.addEventListener("click", function (e) {
    var act = e.target.dataset.action;
    if (act === "add-line") {
      lineCount++;
      var first = reqForm.querySelector(".line-row");
      var copy = first.cloneNode(true);
      // Give the copy its own ids so every label still points at its field
      copy.querySelectorAll("[id]").forEach(function (el) { el.id = el.id.replace(/\d+$/, lineCount); });
      copy.querySelectorAll("label[for]").forEach(function (el) { el.htmlFor = el.htmlFor.replace(/\d+$/, lineCount); });
      copy.querySelector(".rl-item").value = "";
      copy.querySelector(".rl-qty").value = 1;
      copy.querySelector(".rl-due").value = "";
      copy.querySelector(".rl-due").disabled = false;
      copy.querySelector(".rl-msg").innerHTML = "";
      copy.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
      document.getElementById("lines").appendChild(copy);
      copy.querySelector(".rl-item").focus();
    }
    if (act === "remove-line") {
      var rows = reqForm.querySelectorAll(".line-row");
      var line = e.target.closest(".line-row");
      if (rows.length > 1) line.remove();
      else { line.querySelector(".rl-item").value = ""; updateLine(line); }
    }
  });

  reqForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var member = document.getElementById("rq-member");
    clearError(member);
    if (!member.value) { setError(member, "Choose who is borrowing."); ok = false; }
    var seen = {};
    var warnings = [];
    reqForm.querySelectorAll(".line-row").forEach(function (line) {
      var item = line.querySelector(".rl-item");
      var qty = line.querySelector(".rl-qty");
      var due = line.querySelector(".rl-due");
      var msg = line.querySelector(".rl-msg");
      var errors = [];
      [item, qty, due].forEach(function (el) { el.removeAttribute("aria-invalid"); });
      var opt = item.selectedOptions[0];
      if (!item.value) { errors.push("Choose an item."); item.setAttribute("aria-invalid", "true"); }
      else if (seen[item.value]) { errors.push("This item is already on the request. Change the quantity on its first line instead."); item.setAttribute("aria-invalid", "true"); }
      if (!Number.isInteger(Number(qty.value)) || Number(qty.value) < 1) { errors.push("Quantity must be 1 or more."); qty.setAttribute("aria-invalid", "true"); }
      if (opt && opt.dataset.type === "tool" && (!due.value || due.value < TODAY)) { errors.push("Tools need a due date from today on."); due.setAttribute("aria-invalid", "true"); }
      if (item.value) seen[item.value] = true;
      if (errors.length) {
        msg.innerHTML = errors.map(function (t) { return '<p class="error">' + t + "</p>"; }).join("");
        ok = false;
      } else if (Number(qty.value) > Number(opt.dataset.available)) {
        warnings.push(opt.textContent.split(" (")[0] + ": only " + opt.dataset.available + " available, so it can't be approved until more come back.");
      }
    });
    if (!ok) { reqForm.querySelector('[aria-invalid="true"]').focus(); return; }
    var who = member.options[member.selectedIndex].text;
    reqForm.reset();
    reqForm.querySelectorAll(".line-row").forEach(function (line, i) { if (i > 0) line.remove(); else updateLine(line); });
    showMsg(document.getElementById("request-result"), "<p><strong>Request #1019 sent for " + escapeHtml(who) + ".</strong> It is pending until an officer decides.</p>" +
      (warnings.length ? "<p>Heads up: " + warnings.join(" ") + "</p>" : ""), "ok");
  });
}

/* =========================================================
   Settings lookups (settings.html)
   ========================================================= */
document.querySelectorAll(".lookup-form").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = form.querySelector('input[type="text"]');
    var table = form.parentNode.querySelector("table");
    clearError(input);
    var name = input.value.trim();
    var exists = false;
    table.querySelectorAll("tbody tr").forEach(function (row) {
      if (row.querySelector(".lead").textContent.toLowerCase() === name.toLowerCase()) exists = true;
    });
    if (!name) { setError(input, "Type a name."); input.focus(); return; }
    if (exists) { setError(input, "&ldquo;" + escapeHtml(name) + "&rdquo; is already on the list (names are unique)."); input.focus(); return; }
    var id = table.querySelectorAll("tbody tr").length + 1;
    var cols = table.querySelectorAll("thead th").length;
    var row = document.createElement("tr");
    var html = '<td class="id" data-label="' + form.dataset.table + '_id">' + id + '</td><td class="lead" data-label="name">' + escapeHtml(name) + "</td>";
    if (form.dataset.table === "role") {
      html += document.getElementById("new-role-approve").checked
        ? '<td data-label="can_approve"><span class="status status-ok">Yes, can approve</span></td>'
        : '<td data-label="can_approve"><span class="status status-off">No, can only request</span></td>';
    }
    if (cols > (form.dataset.table === "role" ? 3 : 2)) html += '<td class="num" data-label="In use">0</td>';
    row.innerHTML = html;
    table.querySelector("tbody").appendChild(row);
    form.reset();
    document.getElementById(input.id + "-msg").innerHTML = '<p class="hint">Added &ldquo;' + escapeHtml(name) + "&rdquo; as #" + id + ".</p>";
  });
});
