/* =========================================================
   Hygears HQ System - shared script for all 8 pages.
   Plain functions, no libraries. Each page block only runs
   when its elements exist. Nothing is saved: in the PHP
   rebuild every "sample" array below becomes a SELECT and
   every change becomes a form POST.
   ========================================================= */

/* ---------- Helpers ---------- */

// Sample "now" so the sample data makes sense; PHP version uses the real time.
const SAMPLE_NOW = new Date(2026, 10, 24, 11, 5);   // 24 Nov 2026, 11:05 AM (months start at 0)
const LOADED_AT = Date.now();

function now() {
  return new Date(SAMPLE_NOW.getTime() + (Date.now() - LOADED_AT));
}
function $(selector, root) { return (root || document).querySelector(selector); }
function $all(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

function pad(n) { return String(n).padStart(2, '0'); }
// "2026-11-24T09:12" in local time, the same format as a DATETIME from MySQL
function isoLocal(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function fmtTime(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function fmtDate(isoDate) {
  return new Date(isoDate + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function esc(text) {
  return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function icon(name) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }

// Show an inline error (icon + text) under a field; pass '' to clear it.
function setError(el, message, input) {
  if (!el) return;
  el.hidden = !message;
  el.innerHTML = message ? icon('alert') + '<span>' + esc(message) + '</span>' : '';
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

/* ---------- Toast (with optional Undo) ---------- */
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
  toastTimer = setTimeout(() => { toast.innerHTML = ''; }, undo ? 7000 : 4000);
}

/* ---------- Top bar menu (phones and tablets) ---------- */
const menuBtn = $('.menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

/* ---------- Running clocks: the time someone is inside, or a tool is out ---------- */
function formatSpan(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(minutes / 60);
  return h > 0 ? h + 'h ' + pad(minutes % 60) + 'm' : minutes + 'm';
}
// whole days from today to a due date (negative = overdue)
function daysUntil(isoDate) {
  const t = now();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((new Date(isoDate + 'T00:00') - today) / 86400000);
}
function setClockText(el, text) {
  el.lastChild.nodeValue = text;   // the icon stays, only the text node changes
}
function tickClocks() {
  $all('[data-since]').forEach(el => setClockText(el, formatSpan(now() - new Date(el.dataset.since))));
  $all('[data-due]').forEach(el => {
    if (!el.classList.contains('clock')) return;
    const d = daysUntil(el.dataset.due);
    setClockText(el, d < 0 ? (-d) + 'd overdue' : d === 0 ? 'due today' : d + 'd left');
  });
  const clockEl = $('#now');
  if (clockEl) clockEl.textContent = fmtTime(now());
}
tickClocks();
setInterval(tickClocks, 15000);

/* ---------- Sample inventory (v_item_stock); shared by Items and Requests ---------- */
const ITEMS = [
  { id: 1,  name: 'Cordless drill',            category: 'Power tools',           type: 'tool',       total: 2,  available: 1,  reorder: null, active: true },
  { id: 2,  name: 'Angle grinder',             category: 'Power tools',           type: 'tool',       total: 1,  available: 1,  reorder: null, active: true },
  { id: 3,  name: 'Digital multimeter',        category: 'Measuring instruments', type: 'tool',       total: 4,  available: 1,  reorder: null, active: true },
  { id: 4,  name: 'Vernier caliper',           category: 'Measuring instruments', type: 'tool',       total: 3,  available: 3,  reorder: null, active: true },
  { id: 5,  name: 'Torque wrench',             category: 'Hand tools',            type: 'tool',       total: 1,  available: 0,  reorder: null, active: true },
  { id: 6,  name: 'Wire stripper',             category: 'Hand tools',            type: 'tool',       total: 5,  available: 5,  reorder: null, active: true },
  { id: 7,  name: 'Soldering station',         category: 'Electronics',           type: 'tool',       total: 3,  available: 3,  reorder: null, active: true },
  { id: 8,  name: 'Oscilloscope',              category: 'Electronics',           type: 'tool',       total: 1,  available: 1,  reorder: null, active: false },
  { id: 9,  name: 'Solder wire 0.8 mm',        category: 'Soldering consumables', type: 'consumable', total: 10, available: 2,  reorder: 3,    active: true },
  { id: 10, name: 'Flux paste (tub)',          category: 'Soldering consumables', type: 'consumable', total: 2,  available: 5,  reorder: 2,    active: true },
  { id: 11, name: 'Cutting disc 4 in',         category: 'Cutting consumables',   type: 'consumable', total: 8,  available: 3,  reorder: 5,    active: true },
  { id: 12, name: 'Heat-shrink tubing (pack)', category: 'Soldering consumables', type: 'consumable', total: 4,  available: 12, reorder: 4,    active: true }
];
function findItem(id) { return ITEMS.find(item => item.id === Number(id)); }
function isLow(item) { return item.active && item.reorder !== null && item.available <= item.reorder; }

/* =========================================================
   KIOSK (index.html)
   ========================================================= */
const signinForm = $('#signin-form');
if (signinForm) {
  // person rows with a student_id; role null = PUP student who is not a member
  const KIOSK_PEOPLE = [
    { student_id: '2023-00118-MN-0', name: 'Mika Reyes',     role: 'Member' },
    { student_id: '2022-00342-MN-0', name: 'Paolo Santos',   role: 'Officer' },
    { student_id: '2021-00507-MN-0', name: 'Andrea Cruz',    role: 'President' },
    { student_id: '2023-00611-MN-0', name: 'Jun Dela Rosa',  role: 'Member' },
    { student_id: '2022-00274-MN-0', name: 'Bea Villanueva', role: 'Officer' },
    { student_id: '2024-01233-MN-0', name: 'Ken Aquino',     role: null }
  ];
  const sidInput = $('#student_id');
  const list = $('#inside-list');
  let resetTimer = null;

  // compare digits only, so "2023-00118", "202300118" and "2023-00118-MN-0" all match
  // (lets the door phone show the number pad for one-thumb typing)
  function digits(id) { return id.replace(/\D/g, ''); }
  function findPerson(id) {
    const typed = digits(id);
    if (typed.length < 9) return null;
    return KIOSK_PEOPLE.find(p => digits(p.student_id).startsWith(typed));
  }
  function isInside(name) { return $all('li', list).some(li => li.dataset.name === name && !li.classList.contains('just-out')); }

  // phone: Sign in / Sign out tabs
  $all('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
    $all('[data-tab]').forEach(t => t.setAttribute('aria-pressed', t === tab));
    $all('[data-pane]').forEach(p => p.toggleAttribute('data-off', p.dataset.pane !== tab.dataset.tab));
  }));

  // member / visitor switch
  $all('input[name="kind"]').forEach(radio => radio.addEventListener('change', () => {
    const visitor = radio.value === 'visitor' && radio.checked;
    $('#student-fields').hidden = visitor;
    $('#visitor-fields').hidden = !visitor;
    // hidden inputs must not be sent with the form (both groups have first_name)
    $all('input', $('#student-fields')).forEach(i => { i.disabled = visitor; });
    $all('input', $('#visitor-fields')).forEach(i => { i.disabled = !visitor; });
    setError($('#form-error'), '');
  }));

  // live lookup: show whose number it is before they press Sign in
  sidInput.addEventListener('input', () => {
    const person = findPerson(sidInput.value);
    setError($('#sid-error'), '', sidInput);
    $('#sid-found').hidden = !person;
    if (person) {
      $('#sid-found-text').textContent = person.name + ' · ' + (person.role || 'PUP student, not a member');
      $('#first-time').hidden = true;
    }
  });

  function renumber() {
    const rows = $all('li', list);
    rows.forEach((li, i) => { $('.pos', li).textContent = i + 1; });
    const inside = rows.filter(li => !li.classList.contains('just-out')).length;
    $('#inside-count').textContent = inside;
    $('#tab-count').textContent = inside;
  }

  function addInside(name, purpose, visitor) {
    const t = now();
    const li = document.createElement('li');
    li.dataset.name = name;
    li.innerHTML =
      '<span class="pos"></span>' +
      '<span class="who"><strong>' + esc(name) + (visitor ? ' <span class="tag-visitor">Visitor</span>' : '') + '</strong>' +
      '<span>' + esc(purpose) + ' · in ' + fmtTime(t) + '</span></span>' +
      '<span class="clock" data-since="' + isoLocal(t) + '">' + icon('clock') + '0m</span>' +
      '<button class="out-btn" type="button" aria-label="Sign out ' + esc(name) + '">Sign out</button>';
    list.appendChild(li);
    renumber();
  }

  signinForm.addEventListener('submit', event => {
    event.preventDefault();
    const visitor = $('input[name="kind"]:checked').value === 'visitor';
    const purposeInput = $('input[name="purpose_id"]:checked');
    const formError = $('#form-error');
    let name = '';
    let guest = visitor;   // no member row = shown as Visitor
    setError(formError, '');
    setError($('#purpose-error'), '');

    if (visitor) {
      const first = $('#v_first_name'), last = $('#v_last_name'), contact = $('#v_contact_number');
      [first, last, contact].forEach(f => f.setAttribute('aria-invalid', !f.value.trim()));
      const missing = [first, last, contact].find(f => !f.value.trim());
      if (missing) { setError(formError, 'Fill in your first name, last name and contact number.'); missing.focus(); return; }
      name = first.value.trim() + ' ' + last.value.trim();
    } else {
      const id = sidInput.value.trim();
      if (!id) { setError($('#sid-error'), 'Enter your student number, or choose Visitor.', sidInput); sidInput.focus(); return; }
      const person = findPerson(id);
      if (person) {
        name = person.name;
        guest = !person.role;
      } else if ($('#first-time').hidden) {
        // unknown number: ask for a name once, the person row gets created
        $('#first-time').hidden = false;
        setError($('#sid-error'), 'We don\'t have this number yet. Check it, or add your name below.', sidInput);
        $('#ft_first_name').focus();
        return;
      } else {
        const first = $('#ft_first_name'), last = $('#ft_last_name');
        if (!first.value.trim() || !last.value.trim()) { setError(formError, 'Add your first and last name.'); (first.value.trim() ? last : first).focus(); return; }
        name = first.value.trim() + ' ' + last.value.trim();
        KIOSK_PEOPLE.push({ student_id: id, name: name, role: null });
        guest = true;
      }
    }

    if (!purposeInput) { setError($('#purpose-error'), 'Choose why you are here.'); $('input[name="purpose_id"]').focus(); return; }
    if (isInside(name)) { setError(formError, name + ' is already signed in. Use Sign out in the list instead.'); return; }

    const purpose = purposeInput.nextElementSibling.textContent;
    addInside(name, purpose, guest);

    // confirmation screen, clears itself after 8 seconds
    signinForm.hidden = true;
    const done = $('#signin-done');
    done.hidden = false;
    $('#done-name').textContent = 'Signed in, ' + name.split(' ')[0];
    $('#done-detail').textContent = purpose + ' · time in ' + fmtTime(now()) + '. Sign out from the list when you leave.';
    done.focus();
    let seconds = 8;
    $('#done-reset').textContent = 'This screen clears in ' + seconds + ' s.';
    clearInterval(resetTimer);
    resetTimer = setInterval(() => {
      seconds -= 1;
      $('#done-reset').textContent = 'This screen clears in ' + seconds + ' s.';
      if (seconds <= 0) resetKiosk();
    }, 1000);
  });

  function resetKiosk() {
    clearInterval(resetTimer);
    signinForm.reset();
    $('#student-fields').hidden = false;
    $('#visitor-fields').hidden = true;
    $all('input', $('#student-fields')).forEach(i => { i.disabled = false; });
    $('#first-time').hidden = true;
    $('#sid-found').hidden = true;
    setError($('#sid-error'), '', sidInput);
    $('#signin-done').hidden = true;
    signinForm.hidden = false;
  }
  $('#done-btn').addEventListener('click', resetKiosk);

  // sign out: one tap, then a few seconds to undo
  list.addEventListener('click', event => {
    const btn = event.target.closest('.out-btn');
    if (!btn) return;
    const li = btn.closest('li');
    const name = li.dataset.name;
    if (li.classList.contains('just-out')) {          // Undo
      clearTimeout(li.removeTimer);
      li.classList.remove('just-out');
      btn.textContent = 'Sign out';
      btn.setAttribute('aria-label', 'Sign out ' + name);
      renumber();
      showToast(name + ' is still signed in.');
      return;
    }
    const stayed = formatSpan(now() - new Date($('.clock', li).dataset.since));
    li.classList.add('just-out');
    btn.textContent = 'Undo';
    btn.setAttribute('aria-label', 'Undo sign out of ' + name);
    renumber();
    showToast(name + ' signed out at ' + fmtTime(now()) + ' · inside ' + stayed + '.');
    li.removeTimer = setTimeout(() => { li.remove(); renumber(); }, 6000);
  });

  // find your name in a long list
  $('#find-me').addEventListener('input', event => {
    const q = event.target.value.trim().toLowerCase();
    let shown = 0;
    $all('li', list).forEach(li => {
      li.hidden = q && !li.dataset.name.toLowerCase().includes(q);
      if (!li.hidden) shown++;
    });
    $('#inside-empty').hidden = shown > 0;
  });
}

/* =========================================================
   REQUESTS (requests.html)
   ========================================================= */
const pendingList = $('#pending-list');
if (pendingList) {
  const ME = 'Paolo Santos';          // the signed-in officer (from the PHP session)
  let nextId = 1045;

  // lines of a request card whose quantity is more than quantity_available
  function shortLines(card) {
    return $all('.req-lines li', card)
      .map(li => ({ item: findItem(li.dataset.item), qty: Number(li.dataset.qty) }))
      .filter(line => line.qty > line.item.available);
  }

  // stock text on each line + the Approve/Reject buttons or the block message
  function renderCard(card) {
    $all('.req-lines li', card).forEach(li => {
      const item = findItem(li.dataset.item);
      const qty = Number(li.dataset.qty);
      const stock = $('.stock', li);
      stock.className = 'stock' + (qty > item.available ? ' short' : '');
      stock.innerHTML = qty > item.available
        ? icon('alert') + ' only ' + item.available + ' available'
        : item.available + ' available';
    });
    if (card.dataset.self) return;

    const foot = $('.req-foot', card);
    const short = shortLines(card);
    let html = '';
    if (short.length) {
      const what = short.map(s => s.qty + ' × ' + s.item.name + ' (only ' + s.item.available + ' on the shelf)').join(', ');
      html += '<div class="notice alert" tabindex="-1">' + icon('ban') +
        '<p><strong>Can\'t approve yet: not enough stock.</strong> Asked for ' + esc(what) +
        '. Wait for a return, or reject it and ask for a smaller quantity.</p></div>';
    }
    html += '<div class="btn-row">' +
      '<button class="btn btn-primary" type="button" data-approve' + (short.length ? ' aria-disabled="true"' : '') + '>' + icon('check') + 'Approve</button>' +
      '<button class="btn" type="button" data-reject>' + icon('x') + 'Reject</button></div>';
    foot.innerHTML = html;
  }
  function renderAll() {
    $all('.req', pendingList).forEach(renderCard);
    $('#pending-count').textContent = $all('.req', pendingList).length;
    $('#pending-empty').hidden = $all('.req', pendingList).length > 0;
    $('#loan-count').textContent = $all('#loan-body tr').length;
  }

  function closeConfirm(card) {
    const box = $('.confirm', card);
    if (box) box.remove();
  }

  // the confirm strip under a card (approve or reject)
  function openConfirm(card, kind) {
    closeConfirm(card);
    const who = card.dataset.by;
    const items = $all('.req-lines li', card).map(li => findItem(li.dataset.item).name + ' × ' + li.dataset.qty).join(', ');
    const box = document.createElement('div');
    box.className = 'confirm';
    if (kind === 'approve') {
      box.innerHTML = '<p tabindex="-1">Approve #' + card.dataset.id + ' for ' + esc(who) + '? ' + esc(items) + ' will leave the shelf.</p>' +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-yes>' + icon('check') + 'Yes, approve</button>' +
        '<button class="btn btn-quiet" type="button" data-cancel>Cancel</button></div>';
    } else {
      const fid = 'remarks-' + card.dataset.id;
      box.innerHTML = '<div class="field"><label for="' + fid + '">Reason for rejecting #' + card.dataset.id + '</label>' +
        '<textarea id="' + fid + '" placeholder="Shown to ' + esc(who) + ' as remarks"></textarea>' +
        '<p class="error" hidden></p></div>' +
        '<div class="btn-row"><button class="btn btn-dark" type="button" data-yes>' + icon('x') + 'Reject request</button>' +
        '<button class="btn btn-quiet" type="button" data-cancel>Cancel</button></div>';
    }
    box.dataset.kind = kind;
    card.appendChild(box);
    (kind === 'approve' ? $('p', box) : $('textarea', box)).focus();
  }

  function addDecided(card, status, remarks) {
    const items = $all('.req-lines li', card).map(li => findItem(li.dataset.item).name + ' × ' + li.dataset.qty).join(', ');
    const badge = status === 'rejected'
      ? '<span class="status alert">' + icon('x') + 'Rejected</span>'
      : '<span class="status ok">' + icon('check') + (status === 'completed' ? 'Completed' : 'Approved') + '</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="name-cell"><strong>#' + card.dataset.id + ' ' + esc(card.dataset.by) + '</strong><span>today</span></td>' +
      '<td data-label="Items">' + esc(items) + '</td><td data-label="Status">' + badge + '</td>' +
      '<td data-label="Decided by">' + ME + '</td><td data-label="Remarks">' + esc(remarks) + '</td>';
    $('#decided-body').prepend(tr);
  }

  function addLoanRow(card, li) {
    const item = findItem(li.dataset.item);
    const due = li.dataset.due;
    const d = daysUntil(due);
    const cls = d < 0 ? ' late' : d === 0 ? ' today' : '';
    const tr = document.createElement('tr');
    tr.dataset.item = item.id;
    tr.dataset.qty = li.dataset.qty;
    tr.innerHTML = '<td class="name-cell"><strong>' + esc(item.name) + '</strong><span>#' + card.dataset.id + '</span></td>' +
      '<td data-label="Borrower">' + esc(card.dataset.by) + '</td><td data-label="Qty" class="num">' + li.dataset.qty + '</td>' +
      '<td data-label="Due">' + fmtDate(due) + '</td>' +
      '<td data-label="Clock"><span class="clock' + cls + '" data-due="' + due + '">' + icon('clock') + 'due</span></td>' +
      '<td data-label="Actions"><button class="btn btn-sm" type="button" data-return>Mark returned</button></td>';
    $('#loan-body').appendChild(tr);
  }

  pendingList.addEventListener('click', event => {
    const card = event.target.closest('.req');
    if (!card) return;
    const btn = event.target.closest('button');
    if (!btn) return;

    if (btn.hasAttribute('data-approve')) {
      // check stock again at click time: never approve more than quantity_available
      if (shortLines(card).length) {
        renderCard(card);
        $('.notice', card).focus();
        showToast('Not approved: not enough stock for #' + card.dataset.id + '.');
        return;
      }
      openConfirm(card, 'approve');
    } else if (btn.hasAttribute('data-reject')) {
      openConfirm(card, 'reject');
    } else if (btn.hasAttribute('data-cancel')) {
      closeConfirm(card);
      $('[data-approve]', card).focus();
    } else if (btn.hasAttribute('data-yes')) {
      const kind = $('.confirm', card).dataset.kind;
      if (kind === 'approve') {
        if (shortLines(card).length) { closeConfirm(card); renderCard(card); return; }   // stock changed meanwhile
        const lines = $all('.req-lines li', card);
        lines.forEach(li => { findItem(li.dataset.item).available -= Number(li.dataset.qty); });
        const tools = lines.filter(li => findItem(li.dataset.item).type === 'tool');
        tools.forEach(li => addLoanRow(card, li));
        addDecided(card, tools.length ? 'approved' : 'completed', tools.length ? 'Approved' : 'Consumables, nothing to return');
        showToast('#' + card.dataset.id + ' approved for ' + card.dataset.by + '.');
      } else {
        const remarks = $('.confirm textarea', card);
        if (!remarks.value.trim()) {
          setError($('.confirm .error', card), 'Write a short reason so the member knows what to change.', remarks);
          remarks.focus();
          return;
        }
        addDecided(card, 'rejected', remarks.value.trim());
        showToast('#' + card.dataset.id + ' rejected.');
      }
      card.remove();
      renderAll();
      tickClocks();
      $('#pend-title').setAttribute('tabindex', '-1');
      $('#pend-title').focus();
    }
  });

  // mark a tool returned (sets request_line.returned_at), with Undo
  $('#loan-body').addEventListener('click', event => {
    const btn = event.target.closest('[data-return]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const item = findItem(tr.dataset.item);
    const qty = Number(tr.dataset.qty);
    const next = tr.nextElementSibling;
    const body = tr.parentNode;
    item.available += qty;
    tr.remove();
    renderAll();
    showToast(item.name + ' × ' + qty + ' marked returned.', () => {
      item.available -= qty;
      body.insertBefore(tr, next);
      renderAll();
    });
  });

  /* ----- New request form ----- */
  const lines = $('#lines');
  let lineCount = 0;

  function itemOptions() {
    return '<option value="">Choose an item</option>' + ITEMS.filter(i => i.active).map(i =>
      '<option value="' + i.id + '">' + esc(i.name) + ' (' + i.available + ' available)</option>').join('');
  }
  function addLine() {
    lineCount++;
    const n = lineCount;
    const row = document.createElement('div');
    row.className = 'line-row';
    row.innerHTML =
      '<div class="field"><label for="item-' + n + '">Item</label><select id="item-' + n + '" name="item_id[]">' + itemOptions() + '</select></div>' +
      '<div class="field"><label for="qty-' + n + '">Qty</label><input type="number" id="qty-' + n + '" name="quantity[]" min="1" value="1" inputmode="numeric"></div>' +
      '<div class="field due"><label for="due-' + n + '">Due date</label><input type="date" id="due-' + n + '" name="due_date[]" min="2026-11-24"></div>' +
      '<button class="icon-btn" type="button" aria-label="Remove this item" data-remove>' + icon('x') + '</button>';
    lines.appendChild(row);
    $('select', row).addEventListener('change', () => updateDue(row));
    updateDue(row);
  }
  // consumables are used up, so they get no due date (trg_line_consumable_ins)
  function updateDue(row) {
    const item = findItem($('select', row).value);
    const dueField = $('.due', row);
    const consumable = item && item.type === 'consumable';
    $('input', dueField).hidden = consumable;
    let note = $('.no-due', dueField);
    if (consumable && !note) {
      note = document.createElement('span');
      note.className = 'no-due';
      note.textContent = 'No due date: consumable';
      dueField.appendChild(note);
    } else if (!consumable && note) {
      note.remove();
    }
  }
  lines.addEventListener('click', event => {
    if (!event.target.closest('[data-remove]')) return;
    if ($all('.line-row', lines).length > 1) event.target.closest('.line-row').remove();
  });
  $('#add-line').addEventListener('click', () => { addLine(); $('.line-row:last-child select', lines).focus(); });
  addLine();

  $('#request-form').addEventListener('submit', event => {
    event.preventDefault();
    const by = $('#requested_by');
    setError($('#rb-error'), by.value ? '' : 'Choose the member who is borrowing.', by);
    const rows = $all('.line-row', lines);
    const seen = [];
    let problem = '';
    rows.forEach(row => {
      const select = $('select', row), qty = $('input[type="number"]', row), due = $('.due input', row);
      const item = findItem(select.value);
      select.setAttribute('aria-invalid', !item);
      qty.setAttribute('aria-invalid', !(Number(qty.value) >= 1));
      if (!item) problem = problem || 'Choose an item on every line, or remove the empty line.';
      else if (seen.includes(item.id)) problem = problem || item.name + ' is listed twice. Put the total on one line.';
      else if (!(Number(qty.value) >= 1)) problem = problem || 'Quantity must be at least 1.';
      else if (item.type === 'tool' && !due.value) { due.setAttribute('aria-invalid', 'true'); problem = problem || 'Tools need a due date.'; }
      if (item) seen.push(item.id);
    });
    setError($('#lines-error'), problem);
    if (!by.value || problem) { $('[aria-invalid="true"]', event.target).focus(); return; }

    // build the pending card exactly like the ones from the database
    const id = nextId++;
    const card = document.createElement('article');
    card.className = 'req';
    card.dataset.id = id;
    card.dataset.by = by.value;
    if (by.value === ME) card.dataset.self = '1';
    const lineHtml = rows.map(row => {
      const item = findItem($('select', row).value);
      const qty = $('input[type="number"]', row).value;
      const due = $('.due input', row).value;
      const tail = item.type === 'tool' ? ' · due ' + fmtDate(due) : ' · consumable';
      return '<li data-item="' + item.id + '" data-qty="' + qty + '"' + (item.type === 'tool' ? ' data-due="' + due + '"' : '') + '>' +
        '<span>' + esc(item.name) + ' × ' + qty + tail + '</span><span class="stock"></span></li>';
    }).join('');
    card.innerHTML = '<div class="req-top"><h3>#' + id + ' ' + esc(by.value) + ' <span>just now</span></h3>' +
      '<span class="status warn">' + icon('clock') + 'Pending</span></div><ul class="req-lines">' + lineHtml + '</ul>' +
      '<div class="req-foot">' + (card.dataset.self ? '<p class="small muted">' + icon('user') + ' This is your own request, so another officer has to decide it.</p>' : '') + '</div>';
    pendingList.prepend(card);
    renderAll();
    event.target.reset();
    lines.innerHTML = '';
    addLine();
    showToast('Request #' + id + ' added to Pending.');
  });

  renderAll();
}

/* =========================================================
   ITEMS (items.html)
   ========================================================= */
const itemsBody = $('#items-body');
if (itemsBody) {
  function statusHtml(item) {
    if (!item.active) return '<span class="status off">' + icon('ban') + 'Inactive</span>';
    if (isLow(item)) return '<span class="status alert">' + icon('alert') + 'Low stock</span>';
    if (item.available <= 0) return '<span class="status warn">' + icon('clock') + 'All out on loan</span>';
    return '<span class="status ok">' + icon('check') + 'In stock</span>';
  }

  function renderItems() {
    const q = $('#i-search').value.trim().toLowerCase();
    const cat = $('#i-cat').value, type = $('#i-type').value, lowOnly = $('#i-low').checked;
    const shown = ITEMS.filter(i =>
      (!q || i.name.toLowerCase().includes(q)) && (!cat || i.category === cat) &&
      (!type || i.type === type) && (!lowOnly || isLow(i)));
    itemsBody.innerHTML = shown.map(i =>
      '<tr' + (isLow(i) ? ' class="row-alert"' : '') + '>' +
      '<td class="name-cell"><strong>' + esc(i.name) + '</strong></td>' +
      '<td data-label="Category">' + esc(i.category) + '</td>' +
      '<td data-label="Type">' + (i.type === 'tool' ? 'Tool' : 'Consumable') + '</td>' +
      '<td data-label="Total" class="num">' + i.total + '</td>' +
      '<td data-label="Available" class="num"><strong>' + i.available + '</strong></td>' +
      '<td data-label="Reorder at" class="num">' + (i.reorder === null ? '<span class="muted">none</span>' : i.reorder) + '</td>' +
      '<td data-label="Status">' + statusHtml(i) + '</td>' +
      '<td data-label="Actions"><button class="btn btn-sm" type="button" data-edit="' + i.id + '">Edit</button></td></tr>').join('');
    $('#items-count').textContent = shown.length;
    $('#items-empty').hidden = shown.length > 0;

    // low-stock notice (v_low_stock)
    const low = ITEMS.filter(isLow);
    $('#low-notice').hidden = low.length === 0;
    $('#low-text').innerHTML = '<strong>' + low.length + ' item' + (low.length === 1 ? '' : 's') + ' at or below reorder level:</strong> ' +
      low.map(i => esc(i.name) + ' (' + i.available + ' left, reorder at ' + i.reorder + ')').join(', ') + '. <a href="#restock">Restock</a>';

    // restock only consumables: v_item_stock adds restocks to consumables only
    const rs = $('#rs_item_id');
    const keep = rs.value;
    rs.innerHTML = '<option value="">Choose a consumable</option>' + ITEMS.filter(i => i.type === 'consumable' && i.active).map(i =>
      '<option value="' + i.id + '">' + esc(i.name) + ' (' + i.available + ' left)</option>').join('');
    rs.value = keep;
  }
  ['#i-search', '#i-cat', '#i-type', '#i-low'].forEach(sel => $(sel).addEventListener('input', renderItems));

  /* ----- add / edit item ----- */
  const form = $('#item-form');
  function resetItemForm() {
    form.reset();
    $('#item_id').value = '';
    $('#if-title').textContent = 'Add item';
    $('#item-submit').innerHTML = icon('plus') + 'Add item';
    $('#item-cancel').hidden = true;
    setError($('#name-error'), '', $('#name'));
  }
  itemsBody.addEventListener('click', event => {
    const btn = event.target.closest('[data-edit]');
    if (!btn) return;
    const item = findItem(btn.dataset.edit);
    $('#item_id').value = item.id;
    $('#name').value = item.name;
    $('#category_id').value = item.category;
    $('input[name="item_type"][value="' + item.type + '"]').checked = true;
    $('#quantity_total').value = item.total;
    $('#reorder_level').value = item.reorder === null ? '' : item.reorder;
    $('#is_active').checked = item.active;
    $('#if-title').textContent = 'Edit item: ' + item.name;
    $('#item-submit').innerHTML = icon('check') + 'Save changes';
    $('#item-cancel').hidden = false;
    $('#item-form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#name').focus({ preventScroll: true });
  });
  $('#item-cancel').addEventListener('click', resetItemForm);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#name').value.trim();
    const editing = findItem($('#item_id').value);
    // item.name is UNIQUE in the database
    const dupe = ITEMS.find(i => i.name.toLowerCase() === name.toLowerCase() && i !== editing);
    const message = !name ? 'Give the item a name.' : dupe ? 'An item called "' + dupe.name + '" already exists.' : '';
    setError($('#name-error'), message, $('#name'));
    if (message) { $('#name').focus(); return; }

    const total = Math.max(0, Number($('#quantity_total').value) || 0);
    const reorderValue = $('#reorder_level').value;
    const data = {
      name: name,
      category: $('#category_id').value,
      type: $('input[name="item_type"]:checked').value,
      total: total,
      reorder: reorderValue === '' ? null : Number(reorderValue),
      active: $('#is_active').checked
    };
    if (editing) {
      editing.available += total - editing.total;   // more units owned = more on the shelf
      Object.assign(editing, data);
      showToast(name + ' saved.');
    } else {
      ITEMS.push(Object.assign({ id: Math.max(...ITEMS.map(i => i.id)) + 1, available: total }, data));
      showToast(name + ' added to inventory.');
    }
    resetItemForm();
    renderItems();
  });

  /* ----- restock ----- */
  $('#restock-form').addEventListener('submit', event => {
    event.preventDefault();
    const item = findItem($('#rs_item_id').value);
    const qtyInput = $('#rs_quantity');
    const qty = Number(qtyInput.value);
    setError($('#rs-item-error'), item ? '' : 'Choose what you restocked.', $('#rs_item_id'));
    // restock.quantity > 0 (chk_restock_qty)
    setError($('#rs-qty-error'), Number.isInteger(qty) && qty > 0 ? '' : 'Enter how many you added (1 or more).', qtyInput);
    if (!item) { $('#rs_item_id').focus(); return; }
    if (!(Number.isInteger(qty) && qty > 0)) { qtyInput.focus(); return; }

    item.available += qty;
    const li = document.createElement('li');
    li.innerHTML = '<span>' + esc(item.name) + ' · +' + qty + '</span><span class="small muted">' + fmtDate($('#restocked_on').value).replace(/^\w+ /, '') + '</span>';
    $('#restock-log').prepend(li);
    event.target.reset();
    renderItems();
    showToast(item.name + ': +' + qty + ', now ' + item.available + ' available' + (isLow(item) ? ' (still low).' : '.'));
  });

  renderItems();
}

/* =========================================================
   PEOPLE (people.html)
   ========================================================= */
const peopleTable = $('#people-table');
if (peopleTable) {
  function filterPeople() {
    const q = $('#p-search').value.trim().toLowerCase();
    const kind = $('#p-kind').value;
    let shown = 0;
    $all('tbody tr', peopleTable).forEach(tr => {
      tr.hidden = (q && !$('.name-cell', tr).textContent.toLowerCase().includes(q)) || (kind && tr.dataset.kind !== kind);
      if (!tr.hidden) shown++;
    });
    $('#people-count').textContent = shown;
    $('#people-empty').hidden = shown > 0;
  }
  $('#p-search').addEventListener('input', filterPeople);
  $('#p-kind').addEventListener('input', filterPeople);
  $('#people-filters').addEventListener('submit', e => e.preventDefault());

  function activeHtml(active) {
    return active
      ? '<span class="status ok">' + icon('check') + 'Active</span>'
      : '<span class="status off">' + icon('ban') + 'Inactive</span>';
  }

  // member.is_active on/off, and visitor -> member (only with a student_id)
  peopleTable.addEventListener('click', event => {
    const tr = event.target.closest('tr');
    const name = tr && $('strong', tr).textContent;
    if (event.target.closest('[data-toggle-active]')) {
      const btn = event.target.closest('[data-toggle-active]');
      const nowActive = btn.textContent === 'Activate';
      $('[data-label="Status"]', tr).innerHTML = activeHtml(nowActive);
      btn.textContent = nowActive ? 'Deactivate' : 'Activate';
      showToast(name + (nowActive ? ' is active again.' : ' is now inactive and can\'t borrow or approve.'));
    } else if (event.target.closest('[data-make-member]')) {
      tr.dataset.kind = 'member';
      $('[data-label="Role"]', tr).textContent = 'Member';
      $('[data-label="Status"]', tr).innerHTML = activeHtml(true);
      $('[data-label="Actions"]', tr).innerHTML = '<button class="btn btn-sm" type="button" data-toggle-active>Deactivate</button>';
      showToast(name + ' is now a Member (joined today).');
    }
  });

  $('#is_member').addEventListener('change', e => { $('#member-fields').hidden = !e.target.checked; });

  $('#person-form').addEventListener('submit', event => {
    event.preventDefault();
    const first = $('#first_name'), last = $('#last_name'), contact = $('#contact_number'), sid = $('#pf_student_id');
    const member = $('#is_member').checked;
    [first, last, contact].forEach(f => f.setAttribute('aria-invalid', !f.value.trim()));
    const missing = [first, last, contact].find(f => !f.value.trim());
    setError($('#pf-error'), missing ? 'First name, last name and contact number are required.' : '');

    // student_id is UNIQUE, and a member must have one (trg_member_requires_student_id_ins)
    const taken = sid.value.trim() && $all('.name-cell span', peopleTable).some(s => s.textContent.startsWith(sid.value.trim()));
    const sidMessage = member && !sid.value.trim() ? 'A member needs a student number. Visitors without one can\'t be members.'
      : taken ? 'This student number is already registered.' : '';
    setError($('#pf-sid-error'), sidMessage, sid);
    if (missing) { missing.focus(); return; }
    if (sidMessage) { sid.focus(); return; }

    const name = first.value.trim() + ' ' + last.value.trim();
    const role = member ? $('#role_id').selectedOptions[0].textContent : 'Visitor';
    const tr = document.createElement('tr');
    tr.dataset.kind = member ? 'member' : 'visitor';
    tr.innerHTML = '<td class="name-cell"><strong>' + esc(name) + '</strong><span>' + esc(sid.value.trim() || 'No student number') +
      ($('#email').value.trim() && member ? ' · ' + esc($('#email').value.trim()) : '') + '</span></td>' +
      '<td data-label="Role">' + esc(role) + '</td><td data-label="Contact">' + esc(contact.value.trim()) + '</td>' +
      '<td data-label="Affiliation">' + esc($('#affiliation').value.trim()) + '</td>' +
      '<td data-label="Status">' + (member ? activeHtml(true) : '<span class="status off">Not a member</span>') + '</td>' +
      '<td data-label="Actions">' + (member ? '<button class="btn btn-sm" type="button" data-toggle-active>Deactivate</button>'
        : sid.value.trim() ? '<button class="btn btn-sm" type="button" data-make-member>Make member</button>'
        : '<span class="small muted">Needs a student number to join</span>') + '</td>';
    $('tbody', peopleTable).prepend(tr);
    event.target.reset();
    $('#member-fields').hidden = true;
    filterPeople();
    showToast(name + ' added as ' + (member ? role : 'a visitor') + '.');
  });
}

/* =========================================================
   ATTENDANCE (attendance.html)
   ========================================================= */
const attTable = $('#att-table');
if (attTable) {
  function filterAttendance() {
    const date = $('#f-date').value, purpose = $('#f-purpose').value, kind = $('#f-kind').value, inside = $('#f-inside').checked;
    const rows = $all('tbody tr', attTable);
    let shown = 0;
    rows.forEach(tr => {
      tr.hidden = (date && tr.dataset.date !== date) || (purpose && tr.dataset.purpose !== purpose) ||
        (kind && tr.dataset.kind !== kind) || (inside && tr.dataset.inside !== '1');
      if (!tr.hidden) shown++;
    });
    $('#att-count').textContent = 'Showing ' + shown + ' of ' + rows.length + ' visits';
    $('#att-empty').hidden = shown > 0;
  }
  $('#att-filters').addEventListener('input', filterAttendance);
  $('#att-filters').addEventListener('reset', () => setTimeout(() => { $('#f-date').value = ''; filterAttendance(); }));
  $('#att-filters').addEventListener('submit', e => e.preventDefault());
  $('#export-btn').addEventListener('click', () => showToast('Export is a stub in the prototype. The PHP version downloads the filtered rows as CSV.'));
  filterAttendance();
}

/* =========================================================
   REPORTS (reports.html): copy the SQL of a report
   ========================================================= */
$all('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
  const sql = $('.sql', btn.closest('.panel')).textContent;
  navigator.clipboard.writeText(sql)
    .then(() => showToast('SQL copied. Paste it into phpMyAdmin to run it.'))
    .catch(() => showToast('Copy blocked by the browser. Select the SQL and press Ctrl+C.'));
}));

/* =========================================================
   SETTINGS (settings.html): lookup lists
   ========================================================= */
// role.can_approve (delegated, so roles added later work too)
document.addEventListener('change', event => {
  const box = event.target.closest('[data-role]');
  if (!box) return;
  const role = box.closest('li').firstElementChild.textContent;
  showToast(role + (box.checked ? ' can now approve requests.' : ' can no longer approve requests.'));
});
$all('form[data-add]').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const input = $('input', form);
  const value = input.value.trim();
  const list = document.getElementById(form.dataset.add);
  const exists = $all('li > span:first-child', list).some(s => s.textContent.toLowerCase() === value.toLowerCase());
  input.setAttribute('aria-invalid', !value || exists);
  if (!value || exists) {
    showToast(!value ? 'Type a name first.' : value + ' is already in the list (names are unique).');
    input.focus();
    return;
  }
  const li = document.createElement('li');
  li.innerHTML = '<span>' + esc(value) + '</span>' +
    (form.dataset.kind === 'role' ? '<label class="check"><input type="checkbox" data-role>Can approve</label>' : '');
  list.appendChild(li);
  form.reset();
  input.setAttribute('aria-invalid', 'false');
  showToast(value + ' added.');
}));
