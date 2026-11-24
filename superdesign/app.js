/* =========================================================
   Hygears HQ System ("Time Card") - shared script for all 8 pages.
   Plain functions, no libraries. Each page block only runs when
   its elements exist. Nothing is saved: in the PHP rebuild the
   sample lists become SELECTs and each change becomes a form POST.
   ========================================================= */

/* ---------- Helpers ---------- */

// Sample "now" so the sample data makes sense; the PHP version uses the real time.
const SAMPLE_NOW = new Date(2026, 10, 24, 11, 5);   // 24 Nov 2026, 11:05 AM (months start at 0)
const LOADED_AT = Date.now();
const SIGNED_IN = 'Paolo Santos';                    // from the PHP session

function now() { return new Date(SAMPLE_NOW.getTime() + (Date.now() - LOADED_AT)); }
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function esc(text) {
  return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function icon(name) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }

// Show an error (icon + text) in the element with this id; '' clears it.
function setError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = !message;
  el.innerHTML = message ? icon('alert') + '<span>' + esc(message) + '</span>' : '';
  const input = document.getElementById(id.replace(/-error$/, ''));
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

/* ---------- Toast message (with optional Undo) ---------- */
let toastTimer = null;
function showToast(message, undo) {
  const toast = $('#toast');
  toast.innerHTML = '<span>' + esc(message) + '</span>';
  if (undo) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm';
    btn.textContent = 'Undo';
    btn.addEventListener('click', () => { undo(); toast.innerHTML = ''; });
    toast.appendChild(btn);
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.innerHTML = ''; }, undo ? 6000 : 4000);
}

/* ---------- Second-tap safety for Approve / Mark returned ----------
   First tap "arms" the button and changes its text; a second tap within
   4 seconds runs the action. Returns true only on the second tap. */
function secondTap(btn, armedText) {
  if (btn.classList.contains('armed')) {
    clearTimeout(btn.armTimer);
    btn.classList.remove('armed');
    return true;
  }
  btn.dataset.label = btn.innerHTML;
  btn.classList.add('armed');
  btn.textContent = armedText;
  btn.armTimer = setTimeout(() => {
    btn.classList.remove('armed');
    btn.innerHTML = btn.dataset.label;
  }, 4000);
  return false;
}

/* ---------- Sidebar menu on phones and tablets ---------- */
const menuBtn = $('.menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

/* ---------- Time-clock display and "time inside" counters ---------- */
function formatSpan(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(minutes / 60);
  return h > 0 ? h + 'h ' + pad2(minutes % 60) + 'm' : minutes + 'm';
}
function tick() {
  const t = now();
  const clock = $('#clock');
  if (clock) {
    const day = t.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    clock.textContent = (day + ' · ' + fmtTime(t)).toUpperCase();
  }
  $all('.elapsed[data-since]').forEach(el => { el.textContent = formatSpan(t - new Date(el.dataset.since)); });
}
tick();
setInterval(tick, 30000);

/* =========================================================
   DOOR KIOSK (index.html)
   ========================================================= */
if ($('#punch-form')) {
  // person rows that have a student_id (SELECT ... FROM person in PHP)
  const PEOPLE = [
    { student_id: '2023-00118-MN-0', name: 'Mika Reyes',     kind: 'Member' },
    { student_id: '2022-00342-MN-0', name: 'Paolo Santos',   kind: 'Officer' },
    { student_id: '2021-00507-MN-0', name: 'Andrea Cruz',    kind: 'President' },
    { student_id: '2023-00611-MN-0', name: 'Jun Dela Rosa',  kind: 'Member' },
    { student_id: '2022-00274-MN-0', name: 'Bea Villanueva', kind: 'Officer' },
    { student_id: '2016-00088-MN-0', name: 'Lito Garcia',    kind: 'Adviser' },
    { student_id: '2024-01233-MN-0', name: 'Ken Aquino',     kind: 'PUP student (not a member)' }
  ];
  const form = $('#punch-form');
  const sid = $('#student_id');
  const rack = $('#rack');
  let found = null;          // the person matching the typed number
  let resetTimer = null;

  function isVisitor() { return $('#kind-visitor').checked; }
  function digits(text) { return text.replace(/\D/g, ''); }

  // keep the box as "2023-00118": 4-digit year, dash, 5-digit number
  function formatSid(text) {
    const d = digits(text).slice(0, 9);
    return d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d;
  }

  // the rack card of someone still inside, by student number or by name
  function cardFor(studentId, name) {
    return $all('.card', rack).find(c => !c.classList.contains('out') &&
      ((studentId && c.dataset.sid === studentId) || (name && c.dataset.name.toLowerCase() === name.toLowerCase())));
  }

  function updateCounts() {
    const n = $all('.card', rack).filter(c => !c.classList.contains('out')).length;
    $all('.inside-count').forEach(el => { el.textContent = n; });
  }

  // look the number up as it is typed; first-timers get the name fields
  function lookup() {
    const d = digits(sid.value);
    found = d.length === 9 ? PEOPLE.find(p => digits(p.student_id).startsWith(d)) : null;
    const out = $('#sid-found');
    setError('sid-error', '');
    $('#already-in').hidden = true;
    if (found) {
      out.innerHTML = icon('check') + '<span>' + esc(found.name) + ' · ' + esc(found.kind) + '</span>';
    } else if (d.length === 9) {
      out.innerHTML = icon('user') + '<span>New here: add your name below</span>';
    } else {
      out.innerHTML = '';
    }
    $('#name-fields').hidden = !(isVisitor() || (d.length === 9 && !found));
  }

  sid.addEventListener('input', () => { sid.value = formatSid(sid.value); lookup(); });
  $all('#pad button').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.key === 'clear') sid.value = '';
    else if (btn.dataset.key === 'back') sid.value = formatSid(digits(sid.value).slice(0, -1));
    else sid.value = formatSid(sid.value + btn.textContent);
    lookup();
  }));

  // student / visitor switch
  $all('input[name="kind"]').forEach(r => r.addEventListener('change', () => {
    $('#student-fields').hidden = isVisitor();
    $('#name-note').hidden = isVisitor();
    $('#aff-opt').textContent = isVisitor() ? '(required for visitors)' : '(optional)';
    lookup();
  }));

  function required(id, label) {
    const ok = $('#' + id).value.trim() !== '';
    setError(id + '-error', ok ? '' : label + ' is required.');
    return ok;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    let name, studentId = '', kindText;
    if (isVisitor() || !found) {
      if (!isVisitor() && digits(sid.value).length < 9) {
        setError('sid-error', 'Type the 4-digit year and 5-digit number, e.g. 2023-00118.');
        ok = false;
      } else {
        ok = required('first_name', 'First name') & required('last_name', 'Last name') & required('contact_number', 'Contact number');
        if (isVisitor()) ok = required('affiliation', 'School or organization') && ok;
      }
      name = $('#first_name').value.trim() + ' ' + $('#last_name').value.trim();
      kindText = isVisitor() ? 'Visitor' : 'PUP student';
      if (!isVisitor()) studentId = sid.value + '-MN-0';
    } else {
      name = found.name;
      studentId = found.student_id;
      kindText = found.kind;
    }
    const purpose = $('input[name="purpose_id"]:checked');
    setError('purpose-error', purpose ? '' : 'Pick why you are here.');
    if (!ok || !purpose) return;

    // stop a double sign-in: one open attendance row per person
    const open = cardFor(studentId, name);
    if (open) {
      const box = $('#already-in');
      box.innerHTML = icon('alert') + '<p><strong>' + esc(name) + ' is already punched in</strong> (since ' +
        esc(open.querySelector('.punch b').textContent) + ' ' + open.querySelector('.punch').lastChild.textContent +
        '). Leaving? <button class="btn btn-sm" type="button" id="out-instead">Punch out instead</button></p>';
      box.hidden = false;
      $('#out-instead').addEventListener('click', () => { punchOut(open); resetForm(); });
      $('#out-instead').focus();
      return;
    }

    // add the new card to the top of the rack
    const t = now();
    const timeParts = fmtTime(t).split(' ');
    const li = document.createElement('li');
    li.className = 'card';
    li.dataset.name = name;
    li.dataset.sid = studentId;
    li.innerHTML = '<div class="punch">IN<b>' + timeParts[0] + '</b>' + timeParts[1] + '</div>' +
      '<div class="who"><strong>' + esc(name) + '</strong><span>' + (isVisitor() ? 'Visitor · ' : '') +
      esc(purpose.nextElementSibling.textContent) + ' · <span class="elapsed" data-since="' + t.toISOString() + '">0m</span> inside</span></div>' +
      '<div class="act"><button class="btn" type="button" data-out>' + icon('out') + 'Punch out</button></div>';
    rack.prepend(li);
    updateCounts();

    // confirmation card
    $('#punched-stamp').textContent = 'IN ' + fmtTime(t);
    $('#punched-stamp').classList.remove('stamped'); void $('#punched-stamp').offsetWidth; $('#punched-stamp').classList.add('stamped');
    $('#punched-name').textContent = name + ' · ' + kindText;
    $('#punched-purpose').textContent = purpose.nextElementSibling.textContent;
    form.hidden = true;
    $('#punched').hidden = false;
    $('#punch-next').focus();
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetForm, 8000);
  });

  function resetForm() {
    clearTimeout(resetTimer);
    form.reset();
    sid.value = '';
    $('#student-fields').hidden = false;
    $('#name-note').hidden = false;
    $('#aff-opt').textContent = '(optional)';
    $all('.error', form).forEach(el => { el.hidden = true; });
    $all('[aria-invalid]', form).forEach(el => el.setAttribute('aria-invalid', 'false'));
    lookup();
    form.hidden = false;
    $('#punched').hidden = true;
  }
  $('#punch-next').addEventListener('click', resetForm);

  // Punch out: stamps time_out on the card, with Undo for a few seconds
  function punchOut(card) {
    const t = now();
    const parts = fmtTime(t).split(' ');
    const before = card.innerHTML;
    card.classList.add('out');
    card.querySelector('.punch').innerHTML = 'OUT<b>' + parts[0] + '</b>' + parts[1];
    card.querySelector('.act').innerHTML = '<span class="stamp stamped">' + icon('check') + 'Out</span>';
    updateCounts();
    const removeTimer = setTimeout(() => card.remove(), 6000);
    showToast(card.dataset.name + ' punched out at ' + fmtTime(t) + '.', () => {
      clearTimeout(removeTimer);
      card.innerHTML = before;
      card.classList.remove('out');
      updateCounts();
    });
  }
  rack.addEventListener('click', e => {
    const btn = e.target.closest('[data-out]');
    if (btn) punchOut(btn.closest('.card'));
  });

  // find your card when many people are inside
  $('#rack-find').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    $all('.card', rack).forEach(c => {
      c.hidden = !c.dataset.name.toLowerCase().includes(q);
      if (!c.hidden) shown++;
    });
    $('#rack-empty').hidden = shown > 0;
  });
}

/* =========================================================
   ATTENDANCE (attendance.html): filters become a GET query in PHP
   ========================================================= */
if ($('#att-filters')) {
  function filterAttendance() {
    const date = $('#f-date').value, purpose = $('#f-purpose').value, kind = $('#f-kind').value, inside = $('#f-inside').checked;
    let shown = 0;
    $all('#att-table tbody tr').forEach(tr => {
      const ok = (!date || tr.dataset.date === date) && (!purpose || tr.dataset.purpose === purpose) &&
        (!kind || tr.dataset.kind === kind) && (!inside || tr.dataset.inside === '1');
      tr.hidden = !ok;
      if (ok) shown++;
    });
    $('#att-count').textContent = shown;
    $('#att-empty').hidden = shown > 0;
  }
  $('#att-filters').addEventListener('input', filterAttendance);
  $('#att-filters').addEventListener('submit', e => e.preventDefault());
  filterAttendance();
  $('#export-btn').addEventListener('click', () => showToast('Export is a stub here. In PHP it downloads these rows as a CSV file.'));
}

/* ---------- Simple table search (people, items) ---------- */
function tableSearch(inputId, tableId, emptyId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    $all('#' + tableId + ' tbody tr').forEach(tr => {
      tr.hidden = !tr.querySelector('.name-cell').textContent.toLowerCase().includes(q);
      if (!tr.hidden) shown++;
    });
    if (emptyId) document.getElementById(emptyId).hidden = shown > 0;
  });
}

/* =========================================================
   PEOPLE (people.html)
   ========================================================= */
if ($('#person-form')) {
  tableSearch('ppl-find', 'ppl-table', 'ppl-empty');
  const table = $('#ppl-table');

  // member.is_active on / off
  table.addEventListener('click', e => {
    const btn = e.target.closest('[data-active]');
    if (btn) {
      const tr = btn.closest('tr');
      const nowActive = tr.classList.toggle('row-inactive') === false;
      tr.querySelector('[data-status]').innerHTML = nowActive ? icon('check') + 'Active' : icon('ban') + 'Inactive';
      btn.textContent = nowActive ? 'Set inactive' : 'Set active';
      showToast(tr.querySelector('strong').textContent + (nowActive ? ' is active again.' : ' is now inactive and can no longer borrow or approve.'));
    }
    // "Make member" opens the small inline form in that row
    const make = e.target.closest('[data-make-member]');
    if (make) {
      make.hidden = true;
      make.nextElementSibling.hidden = false;
      $('select', make.nextElementSibling).focus();
    }
    if (e.target.closest('[data-cancel-member]')) {
      const box = e.target.closest('.make-form');
      box.hidden = true;
      box.previousElementSibling.hidden = false;
      box.previousElementSibling.focus();
    }
    if (e.target.closest('[data-save-member]')) {
      const tr = e.target.closest('tr');
      const role = $('select', tr);
      tr.querySelector('[data-label="Role"]').textContent = role.options[role.selectedIndex].text;
      tr.querySelector('[data-label="Status"]').innerHTML = '<span class="status ok" data-status>' + icon('check') + 'Active</span>';
      tr.querySelector('[data-label="Actions"]').innerHTML = '<button class="btn btn-sm" type="button" data-active>Set inactive</button>';
      showToast(tr.querySelector('strong').textContent + ' is now a member (' + role.options[role.selectedIndex].text + ').');
    }
  });

  // membership needs a student number (trg_member_requires_student_id_ins)
  const sidInput = $('#student_id'), memberBox = $('#is_member');
  sidInput.addEventListener('input', () => {
    const has = sidInput.value.trim() !== '';
    memberBox.disabled = !has;
    if (!has) { memberBox.checked = false; $('#member-fields').hidden = true; }
    $('#mem-hint').textContent = has ? 'Members can borrow; officers can approve.' : "Type a student number first. Visitors without one can't be members.";
  });
  memberBox.addEventListener('change', () => { $('#member-fields').hidden = !memberBox.checked; });

  $('#person-form').addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    [['first_name', 'First name'], ['last_name', 'Last name'], ['contact_number', 'Contact number']].forEach(([id, label]) => {
      const filled = $('#' + id).value.trim() !== '';
      setError(id + '-error', filled ? '' : label + ' is required.');
      if (!filled) ok = false;
    });
    // student_id is UNIQUE in the person table
    const sidVal = sidInput.value.trim();
    const taken = sidVal && $all('.name-cell span', table).some(s => s.textContent === sidVal);
    setError('student_id-error', taken ? 'That student number already belongs to someone.' : '');
    if (!ok || taken) return;

    const name = $('#first_name').value.trim() + ' ' + $('#last_name').value.trim();
    const member = memberBox.checked;
    const role = $('#role_id');
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="name-cell"><strong>' + esc(name) + '</strong><span>' + esc(sidVal || 'no student number') + '</span></td>' +
      '<td data-label="Role">' + (member ? esc(role.options[role.selectedIndex].text.replace(/ \(.*/, '')) : 'Visitor') + '</td>' +
      '<td data-label="Contact">' + esc($('#email').value || $('#contact_number').value) + '</td>' +
      '<td data-label="Status">' + (member ? '<span class="status ok" data-status>' + icon('check') + 'Active</span>' : 'Not a member') + '</td>' +
      '<td data-label="Actions">' + (member ? '<button class="btn btn-sm" type="button" data-active>Set inactive</button>' : '') + '</td>';
    $('tbody', table).appendChild(tr);
    $('#ppl-count').textContent = $all('tbody tr', table).length;
    showToast(name + ' added' + (member ? ' as a member.' : ' as a visitor.'));
    e.target.reset();
    memberBox.disabled = true;
    $('#member-fields').hidden = true;
  });
}

/* =========================================================
   ITEMS (items.html)
   ========================================================= */
if ($('#item-form')) {
  tableSearch('items-find', 'items-table');
  const tbody = $('#items-table tbody');
  const form = $('#item-form');
  let editing = null;   // the row being edited, or null when adding

  // same rule as the v_low_stock view: active, has a reorder level, available <= reorder level
  function refreshLow() {
    const low = [];
    $all('tr', tbody).forEach(tr => {
      const avail = Number(tr.querySelector('[data-avail]').textContent);
      const active = tr.dataset.active === '1';
      const isLow = active && tr.dataset.reorder !== '' && avail <= Number(tr.dataset.reorder);
      tr.className = isLow ? 'row-alert' : (active ? '' : 'row-inactive');
      let status = '<span class="status ok">' + icon('check') + 'In stock</span>';
      if (!active) status = '<span class="status">' + icon('ban') + 'Inactive</span>';
      else if (isLow) status = '<span class="stamp alert flat">' + icon('alert') + 'Low stock</span>';
      else if (avail === 0) status = '<span class="status">' + icon('clock') + 'All out on loan</span>';
      tr.querySelector('[data-status]').innerHTML = status;
      if (isLow) low.push(tr.querySelector('strong').textContent);
    });
    $('#low-note').hidden = low.length === 0;
    $('#low-count').textContent = low.length;
    $('#low-names').textContent = low.join(', ');
    $('#items-count').textContent = $all('tr', tbody).length;
  }

  function setType(type) {
    $('#qt-label').textContent = type === 'tool' ? 'Units owned' : 'Starting stock';
  }
  $all('input[name="item_type"]').forEach(r => r.addEventListener('change', () => setType(r.value)));

  // Edit fills the form from the row
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-edit]');
    if (!btn) return;
    editing = btn.closest('tr');
    $('#item_id').value = editing.dataset.id;
    $('#name').value = editing.querySelector('strong').textContent;
    $('#category_id').value = $all('#category_id option').find(o => o.text === editing.dataset.category).value;
    $('#t-' + (editing.dataset.type === 'tool' ? 'tool' : 'cons')).checked = true;
    setType(editing.dataset.type);
    $('#quantity_total').value = editing.dataset.total;
    $('#reorder_level').value = editing.dataset.reorder;
    $('#is_active').checked = editing.dataset.active === '1';
    $('#item-form-title').textContent = 'Edit item';
    $('#item-submit').innerHTML = icon('check') + 'Save changes';
    $('#item-cancel').hidden = false;
    $('#name').focus();
  });

  function resetItemForm() {
    editing = null;
    form.reset();
    setType('tool');
    $('#item-form-title').textContent = 'Add an item';
    $('#item-submit').innerHTML = icon('plus') + 'Add item';
    $('#item-cancel').hidden = true;
    ['name', 'category_id', 'quantity_total'].forEach(id => setError(id + '-error', ''));
  }
  $('#item-cancel').addEventListener('click', resetItemForm);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const cat = $('#category_id');
    const qty = $('#quantity_total').value;
    // item.name is UNIQUE
    const dup = $all('strong', tbody).some(s => s.textContent.toLowerCase() === name.toLowerCase() && s.closest('tr') !== editing);
    setError('name-error', !name ? 'Item name is required.' : dup ? 'An item with this name already exists.' : '');
    setError('category_id-error', cat.value ? '' : 'Choose a category.');
    setError('quantity_total-error', qty !== '' && Number(qty) >= 0 && Number.isInteger(Number(qty)) ? '' : 'Enter a whole number, 0 or more.');
    if (!name || dup || !cat.value || $('#quantity_total-error').hidden === false) return;

    const type = $('input[name="item_type"]:checked').value;
    const reorder = $('#reorder_level').value;
    const tr = editing || document.createElement('tr');
    // a new item starts with everything on the shelf; an edit keeps what is out
    const out = editing ? Number(editing.dataset.total) - Number(editing.querySelector('[data-avail]').textContent) : 0;
    tr.dataset.id = editing ? editing.dataset.id : $all('tr', tbody).length + 1;
    tr.dataset.category = cat.options[cat.selectedIndex].text;
    tr.dataset.type = type;
    tr.dataset.total = qty;
    tr.dataset.reorder = reorder;
    tr.dataset.active = $('#is_active').checked ? '1' : '0';
    tr.innerHTML = '<td class="name-cell"><strong>' + esc(name) + '</strong><span>' + esc(tr.dataset.category) + '</span></td>' +
      '<td data-label="Type">' + (type === 'tool' ? 'Tool' : 'Consumable') + '</td><td data-label="Total" class="num">' + qty + '</td>' +
      '<td data-label="Available" class="num" data-avail>' + Math.max(0, Number(qty) - out) + '</td><td data-label="Reorder at" class="num">' + esc(reorder) + '</td>' +
      '<td data-label="Status" data-status></td><td data-label="Actions"><button class="btn btn-sm" type="button" data-edit>Edit</button></td>';
    if (!editing) {
      tbody.appendChild(tr);
      if (type === 'consumable') {
        const opt = document.createElement('option');
        opt.value = tr.dataset.id;
        opt.textContent = name;
        $('#r-item').appendChild(opt);
      }
    }
    refreshLow();
    showToast(editing ? name + ' saved.' : name + ' added to the inventory.');
    resetItemForm();
  });

  // Restock: a restock row adds to a consumable's available stock
  $('#restock-form').addEventListener('submit', e => {
    e.preventDefault();
    const sel = $('#r-item');
    const qty = Number($('#r-qty').value);
    setError('r-item-error', sel.value ? '' : 'Choose the consumable you restocked.');
    setError('r-qty-error', Number.isInteger(qty) && qty > 0 ? '' : 'Quantity must be 1 or more.');
    if (!sel.value || !(Number.isInteger(qty) && qty > 0)) return;
    const tr = $('tr[data-id="' + sel.value + '"]', tbody);
    const cell = tr.querySelector('[data-avail]');
    cell.textContent = Number(cell.textContent) + qty;
    refreshLow();
    const name = sel.options[sel.selectedIndex].text;
    const li = document.createElement('li');
    const d = new Date($('#r-date').value + 'T00:00');
    li.innerHTML = '<span>' + esc(name) + ' + ' + qty + '</span><span class="mono small">' +
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span>';
    $('#restock-list').prepend(li);
    showToast(name + ': +' + qty + ', now ' + cell.textContent + ' available.');
    e.target.reset();
    $('#r-date').value = '2026-11-24';
  });
}

/* =========================================================
   REQUESTS (requests.html)
   ========================================================= */
if ($('#request-form')) {
  // v_item_stock: quantity_available per item_id. Approving takes stock off
  // the shelf; Mark returned puts tools back. (PHP: re-read the view.)
  const STOCK = {
    1: { name: 'Cordless drill', type: 'tool', avail: 1 },
    2: { name: 'Angle grinder', type: 'tool', avail: 1 },
    3: { name: 'Digital multimeter', type: 'tool', avail: 1 },
    4: { name: 'Vernier caliper', type: 'tool', avail: 3 },
    5: { name: 'Torque wrench', type: 'tool', avail: 0 },
    6: { name: 'Wire stripper', type: 'tool', avail: 5 },
    7: { name: 'Soldering station', type: 'tool', avail: 3 },
    9: { name: 'Solder wire 0.8 mm', type: 'consumable', avail: 2 },
    10: { name: 'Flux paste (tub)', type: 'consumable', avail: 5 },
    11: { name: 'Cutting disc 4 in', type: 'consumable', avail: 3 },
    12: { name: 'Heat-shrink tubing (pack)', type: 'consumable', avail: 12 }
  };
  let nextRequestId = 1045;

  // shelf check on every pending line
  function renderStock() {
    $all('#pending .slip:not(.decided) .lines li').forEach(li => {
      const s = STOCK[li.dataset.item];
      const qty = Number(li.dataset.qty);
      li.querySelector('.stock').innerHTML = qty <= s.avail
        ? '<span class="status ok">' + icon('check') + s.avail + ' on the shelf</span>'
        : '<span class="status alert">' + icon('alert') + 'Only ' + s.avail + ' on the shelf</span>';
    });
  }

  function updateCounts() {
    const pending = $all('#pending .slip:not(.decided)').length;
    $('#pending-count').textContent = pending;
    $('#pending-count-jump').textContent = pending;
    $('#pending-empty').hidden = pending > 0;
    $('#loan-count').textContent = $all('#loan-body tr:not(.row-done)').length;
    $('#overdue-jump').textContent = $all('#loan-body tr.row-alert').length;
  }

  // lines on a slip asking for more than the shelf has
  function shortages(slip) {
    return $all('.lines li', slip).filter(li => Number(li.dataset.qty) > STOCK[li.dataset.item].avail);
  }

  // stamp a slip (decided_by = signed-in officer, decided_at = now)
  function stampSlip(slip, word, iconName, note) {
    slip.classList.add('decided');
    $('.slip-actions', slip).remove();
    const form = $('.reject-form', slip);
    if (form) form.remove();
    $('.slip-msg', slip).innerHTML = '';
    $all('.stock', slip).forEach(s => { s.innerHTML = ''; });
    const spot = document.createElement('p');
    spot.className = 'stamp-spot';
    spot.innerHTML = '<span class="stamp stamp-big stamped">' + icon(iconName) + esc(word) + '</span> <span class="small">by ' +
      esc(SIGNED_IN) + ' · ' + fmtTime(now()) + (note ? ' · ' + esc(note) : '') + '</span>';
    slip.appendChild(spot);
    updateCounts();
    renderStock();
  }

  function approve(slip) {
    let tools = 0;
    $all('.lines li', slip).forEach(li => {
      const s = STOCK[li.dataset.item];
      const qty = Number(li.dataset.qty);
      s.avail -= qty;
      if (s.type === 'tool') {
        tools++;
        const due = new Date(li.dataset.due + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const tr = document.createElement('tr');
        tr.dataset.item = li.dataset.item;
        tr.dataset.qty = qty;
        tr.innerHTML = '<td class="name-cell"><strong>' + esc(s.name) + '</strong><span>#' + slip.dataset.id + '</span></td><td data-label="Borrower">' +
          esc(slip.dataset.by) + '</td><td data-label="Qty" class="num">' + qty + '</td><td data-label="Due"><span class="status ok">' + icon('check') +
          'Just borrowed</span><br><span class="small">' + due + '</span></td><td data-label="Actions"><button class="btn btn-sm" type="button" data-return>Mark returned</button></td>';
        $('#loan-body').appendChild(tr);
      }
    });
    // consumables-only requests are done at once; requests with tools stay approved until returned
    stampSlip(slip, tools ? 'Approved' : 'Completed', 'check', tools ? 'tools added to Out on loan' : 'consumables, nothing to return');
    showToast('#' + slip.dataset.id + ' stamped ' + (tools ? 'APPROVED.' : 'COMPLETED.'));
  }

  $('#pending').addEventListener('click', e => {
    const slip = e.target.closest('.slip');
    if (!slip) return;
    const msg = $('.slip-msg', slip);

    const approveBtn = e.target.closest('[data-approve]');
    if (approveBtn) {
      // block approving more than quantity_available (the database does not)
      const short = shortages(slip);
      if (short.length) {
        msg.innerHTML = '<div class="notice alert">' + icon('alert') + '<p><strong>Can\'t approve yet.</strong> ' + short.map(li => {
          const s = STOCK[li.dataset.item];
          return esc(s.name) + ': ' + li.dataset.qty + ' asked, only ' + s.avail + ' on the shelf';
        }).join('; ') + '. Wait for a return, or reject it with a reason.</p></div>';
        return;
      }
      msg.innerHTML = '';
      if (secondTap(approveBtn, 'Tap again to stamp APPROVED')) approve(slip);
      return;
    }

    // Reject: opens a required reason box; "Stamp REJECTED" is the second tap
    if (e.target.closest('[data-reject]')) {
      msg.innerHTML = '';
      if (!$('.reject-form', slip)) {
        const id = 'reason-' + slip.dataset.id;
        const box = document.createElement('div');
        box.className = 'reject-form field';
        box.innerHTML = '<label for="' + id + '">Reason for rejecting <span class="optional">(saved to remarks, the member sees it)</span></label>' +
          '<textarea id="' + id + '" name="remarks"></textarea><p class="error" id="' + id + '-error" hidden></p>' +
          '<div class="btn-row" style="margin-top:8px"><button class="btn btn-primary" type="button" data-confirm-reject>' + icon('x') +
          'Stamp REJECTED</button><button class="btn btn-ghost" type="button" data-cancel-reject>Cancel</button></div>';
        slip.insertBefore(box, $('.slip-actions', slip));
      }
      $('.reject-form textarea', slip).focus();
      return;
    }
    if (e.target.closest('[data-cancel-reject]')) {
      $('.reject-form', slip).remove();
      $('[data-reject]', slip).focus();
      return;
    }
    if (e.target.closest('[data-confirm-reject]')) {
      const reason = $('.reject-form textarea', slip).value.trim();
      setError('reason-' + slip.dataset.id + '-error', reason ? '' : 'Write a reason so the member knows what to do next.');
      if (!reason) return;
      stampSlip(slip, 'Rejected', 'x', '"' + reason + '"');
      showToast('#' + slip.dataset.id + ' stamped REJECTED.');
    }
  });

  // Mark returned: second tap, then returned_at = now and the tool is back on the shelf
  $('#loan-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-return]');
    if (!btn || !secondTap(btn, 'Tap again to confirm')) return;
    const tr = btn.closest('tr');
    STOCK[tr.dataset.item].avail += Number(tr.dataset.qty);
    tr.className = 'row-done';
    tr.querySelector('[data-label="Due"]').innerHTML = '<span class="stamp stamped">' + icon('check') + 'Returned</span><br><span class="small">' + fmtTime(now()) + '</span>';
    tr.querySelector('[data-label="Actions"]').innerHTML = '';
    updateCounts();
    renderStock();
    showToast(STOCK[tr.dataset.item].name + ' is back on the shelf (' + STOCK[tr.dataset.item].avail + ' available).');
  });

  /* ----- New request slip: item_id[], quantity[], due_date[] ----- */
  let lineNo = 0;
  function addLine() {
    lineNo++;
    const line = $('#line-template').content.firstElementChild.cloneNode(true);
    // unique ids so each label points at its own field
    $all('.field', line).forEach((f, i) => {
      const input = $('select, input', f);
      input.id = 'line' + lineNo + '-' + ['item', 'qty', 'due'][i];
      $('label', f).htmlFor = input.id;
    });
    const sel = $('select', line), due = $('input[type="date"]', line);
    sel.addEventListener('change', () => {
      const s = STOCK[sel.value];
      $('.line-stock', line).textContent = s ? s.avail + ' on the shelf now' : '';
      // consumables have no due date: empty and lock it (readonly, so due_date[] still lines up in PHP)
      const consumable = s && s.type === 'consumable';
      due.readOnly = consumable;
      due.classList.toggle('na', consumable);
      if (consumable) due.value = '';
      $('.line-due-hint', line).textContent = consumable ? 'No due date: consumables are used up' : 'Tools only: return by this date';
    });
    $('.line-remove', line).addEventListener('click', () => {
      if ($all('#lines .req-line').length > 1) { line.remove(); $('#add-line').focus(); }
    });
    $('#lines').appendChild(line);
    return line;
  }
  addLine();
  $('#add-line').addEventListener('click', () => { $('select', addLine()).focus(); });

  $('#request-form').addEventListener('submit', e => {
    e.preventDefault();
    const by = $('#requested_by');
    setError('requested_by-error', by.value ? '' : 'Choose who is borrowing.');
    const problems = [];
    const seen = {};
    $all('#lines .req-line').forEach((line, i) => {
      const item = $('select', line).value, qty = Number($('input[type="number"]', line).value), due = $('input[type="date"]', line).value;
      const n = 'Line ' + (i + 1) + ': ';
      if (!item) { problems.push(n + 'choose an item.'); return; }
      const s = STOCK[item];
      if (seen[item]) problems.push(n + s.name + ' is already on this slip; change the quantity instead.');   // uq_line_request_item
      seen[item] = true;
      if (!(Number.isInteger(qty) && qty > 0)) problems.push(n + 'quantity must be 1 or more.');
      else if (qty > s.avail) problems.push(n + 'only ' + s.avail + ' ' + s.name + ' on the shelf now.');
      if (s.type === 'tool' && !due) problems.push(n + 'tools need a due date.');
      else if (s.type === 'tool' && due < '2026-11-24') problems.push(n + 'the due date can\'t be in the past.');
    });
    const box = $('#lines-error');
    box.hidden = problems.length === 0;
    box.innerHTML = problems.length ? icon('alert') + '<span>' + problems.map(esc).join('<br>') + '</span>' : '';
    if (!by.value || problems.length) return;
    showToast('Slip #' + nextRequestId++ + ' sent for ' + by.options[by.selectedIndex].text + '. It waits as pending for an officer.');
    e.target.reset();
    $('#lines').innerHTML = '';
    addLine();
  });

  renderStock();
  updateCounts();
}

/* =========================================================
   SETTINGS (settings.html): lookups
   ========================================================= */
$all('[data-approve-toggle]').forEach(box => box.addEventListener('change', () => {
  box.nextElementSibling.textContent = box.checked ? 'Yes' : 'No';
  const role = box.closest('tr').firstElementChild.textContent;
  showToast(role + ': can_approve = ' + (box.checked ? 'TRUE' : 'FALSE') + '.');
}));

$all('.lookup-form').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  const input = $('input', form), err = $('.error', form);
  const list = document.getElementById(form.dataset.list);
  const name = input.value.trim();
  const items = list.tagName === 'TABLE' ? $all('tbody tr td:first-child', list) : $all('li', list);
  // every lookup name is UNIQUE in the database
  const dup = items.some(el => el.textContent.trim().toLowerCase() === name.toLowerCase());
  const message = !name ? 'Type a name.' : dup ? name + ' already exists.' : '';
  err.hidden = !message;
  err.innerHTML = message ? icon('alert') + '<span>' + esc(message) + '</span>' : '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) return;
  if (list.tagName === 'TABLE') {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + esc(name) + '</td><td><label class="check"><input type="checkbox" data-approve-toggle><span>No</span></label></td>';
    $('tbody', list).appendChild(tr);
    const box = $('input', tr);
    box.addEventListener('change', () => { box.nextElementSibling.textContent = box.checked ? 'Yes' : 'No'; });
  } else {
    const li = document.createElement('li');
    li.textContent = name;
    list.appendChild(li);
  }
  showToast(name + ' added.');
  input.value = '';
}));
