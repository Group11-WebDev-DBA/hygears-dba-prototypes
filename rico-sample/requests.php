<?php
require __DIR__ . '/lib.php';

if (is_post() && ($_POST['action'] ?? '') === 'new_request') {
    try {
        run('INSERT INTO item_request (requested_by, remarks) VALUES (?, ?)',
            [$_POST['requested_by'], blank_to_null($_POST['remarks'])]);
        $id = db()->lastInsertId();
        flash('ok', 'Request #' . $id . ' created (pending). Add items below.');
        redirect('request.php?id=' . $id);
    } catch (Throwable $e) {
        flash('error', $e->getMessage());
        redirect('requests.php');
    }
}

page_header('Requests');
?>
<fieldset><legend>New request</legend>
  <form method="post">
    <input type="hidden" name="action" value="new_request">
    Requested by (members only) <select name="requested_by"><?= options(member_labels(), 'person_id', 'label') ?></select>
    Remarks <input name="remarks">
    <button>Create request</button>
  </form>
  <small>The dropdown only lists members. Visitors cannot borrow because requested_by is a foreign key to member.</small>
</fieldset>

<h2>All requests</h2>
<?php
$list = rows("SELECT q.request_id, CONCAT(rp.first_name, ' ', rp.last_name) AS requested_by, q.status,
                     CONCAT(dp.first_name, ' ', dp.last_name) AS decided_by, q.requested_at, q.decided_at,
                     (SELECT COUNT(*) FROM request_line l WHERE l.request_id = q.request_id) AS line_count, q.remarks
              FROM item_request q
              JOIN person rp ON rp.person_id = q.requested_by
              LEFT JOIN person dp ON dp.person_id = q.decided_by
              ORDER BY q.request_id DESC");
if (!$list) { echo '<p><em>(no rows)</em></p>'; }
else { ?>
<table>
  <tr><th>id</th><th>requested_by</th><th>status</th><th>decided_by</th><th>requested_at</th>
      <th>decided_at</th><th>line_count</th><th>remarks</th><th></th></tr>
  <?php foreach ($list as $r): ?>
  <tr>
    <?php foreach ($r as $v): ?>
      <td><?= $v === null ? '<span class="null">NULL</span>' : h($v) ?></td>
    <?php endforeach; ?>
    <td><a href="request.php?id=<?= h($r['request_id']) ?>">open</a></td>
  </tr>
  <?php endforeach; ?>
</table>
<?php }
page_footer();
