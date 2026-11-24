<?php
require __DIR__ . '/lib.php';

$id = (int)($_GET['id'] ?? 0);
$self = 'request.php?id=' . $id;

if (is_post()) {
    $a = $_POST['action'] ?? '';
    if ($a === 'add_line') {
        handle('Line added.', function () use ($id) {
            run('INSERT INTO request_line (request_id, item_id, quantity, due_date) VALUES (?,?,?,?)',
                [$id, $_POST['item_id'], $_POST['quantity'], blank_to_null($_POST['due_date'])]);
        });
    } elseif ($a === 'decide') {
        handle('Decision saved.', function () use ($id) {
            $status = $_POST['status'] ?? '';
            if (!in_array($status, ['approved', 'rejected'], true)) throw new Exception('Pick approved or rejected.');
            $n = run("UPDATE item_request
                      SET decided_by = ?, decided_at = NOW(), status = ?, remarks = COALESCE(?, remarks)
                      WHERE request_id = ? AND status = 'pending'",
                     [blank_to_null($_POST['decided_by']), $status, blank_to_null($_POST['remarks']), $id])->rowCount();
            if ($n === 0) throw new Exception('Nothing changed (is the request still pending?).');
        });
    } elseif ($a === 'return_line') {
        handle('Marked returned.', function () use ($id) {
            run('UPDATE request_line SET returned_at = NOW() WHERE line_id = ? AND request_id = ?',
                [$_POST['line_id'], $id]);
        });
    } elseif ($a === 'complete') {
        handle('Request marked completed.', function () use ($id) {
            run("UPDATE item_request SET status = 'completed' WHERE request_id = ? AND status = 'approved'", [$id]);
        });
    }
    redirect($self);
}

$req = one("SELECT q.*, CONCAT(rp.first_name, ' ', rp.last_name) AS requester_name,
                   CONCAT(dp.first_name, ' ', dp.last_name) AS decider_name
            FROM item_request q
            JOIN person rp ON rp.person_id = q.requested_by
            LEFT JOIN person dp ON dp.person_id = q.decided_by
            WHERE q.request_id = ?", [$id]);

page_header('Request #' . $id);
if (!$req) { echo '<p>No such request. <a href="requests.php">Back</a></p>'; page_footer(); exit; }

echo '<p>Requested by <b>' . h($req['requester_name']) . '</b> at ' . h($req['requested_at']) .
     ' | Status: <b>' . h($req['status']) . '</b>';
if ($req['decided_by'] !== null) echo ' | Decided by <b>' . h($req['decider_name']) . '</b> at ' . h($req['decided_at']);
if ($req['remarks'] !== null) echo ' | Remarks: ' . h($req['remarks']);
echo '</p>';

if ($req['status'] === 'pending'): ?>
<fieldset><legend>Add item line (only allowed here while pending)</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_line">
    Item <select name="item_id"><?= options(rows("SELECT item_id, CONCAT(name, ' (', item_type, ')') AS label FROM item WHERE is_active = 1 ORDER BY name"), 'item_id', 'label') ?></select>
    Quantity <input type="number" name="quantity" value="1" required>
    Due date <input type="date" name="due_date">
    <button>Add line</button>
  </form>
  <small>Tools: set a due date. Consumables: leave it blank (a due date should be rejected by the trigger).</small>
</fieldset>

<fieldset><legend>Decide</legend>
  <form method="post">
    <input type="hidden" name="action" value="decide">
    Decided by <select name="decided_by"><?= options(member_labels(), 'person_id', 'label', null, '(nobody)') ?></select>
    Decision <select name="status"><option>approved</option><option>rejected</option></select>
    Remarks <input name="remarks">
    <button>Save decision</button>
  </form>
  <small>Things to try: pick a non-approver, pick the requester, or pick (nobody).</small>
</fieldset>
<?php endif; ?>

<?php if ($req['status'] === 'approved'): ?>
<form method="post">
  <input type="hidden" name="action" value="complete">
  <button>Mark request completed</button>
</form>
<?php endif; ?>

<h2>Lines</h2>
<?php
$lines = rows("SELECT l.line_id, i.name AS item, i.item_type, l.quantity, l.due_date, l.returned_at
               FROM request_line l JOIN item i ON i.item_id = l.item_id
               WHERE l.request_id = ? ORDER BY l.line_id", [$id]);
if (!$lines) { echo '<p><em>(no lines yet)</em></p>'; }
else { ?>
<table>
  <tr><th>line_id</th><th>item</th><th>type</th><th>quantity</th><th>due_date</th><th>returned_at</th><th></th></tr>
  <?php foreach ($lines as $l): ?>
  <tr>
    <?php foreach ($l as $v): ?>
      <td><?= $v === null ? '<span class="null">NULL</span>' : h($v) ?></td>
    <?php endforeach; ?>
    <td>
      <?php if ($l['returned_at'] === null && $req['status'] !== 'pending'): ?>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="return_line">
        <input type="hidden" name="line_id" value="<?= h($l['line_id']) ?>">
        <button>Mark returned</button>
      </form>
      <?php endif; ?>
    </td>
  </tr>
  <?php endforeach; ?>
</table>
<?php } ?>
<p><a href="requests.php">Back to all requests</a></p>
<?php page_footer();
