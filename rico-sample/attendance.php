<?php
require __DIR__ . '/lib.php';

if (is_post()) {
    $a = $_POST['action'] ?? '';
    if ($a === 'sign_in') {
        handle('Attendance recorded.', function () {
            // time_in / time_out are optional; blank time_in = now. Fill both to test the time_out > time_in check.
            run('INSERT INTO attendance (person_id, purpose_id, time_in, time_out, notes)
                 VALUES (?, ?, COALESCE(?, NOW()), ?, ?)',
                [$_POST['person_id'], $_POST['purpose_id'], dt($_POST['time_in']), dt($_POST['time_out']),
                 blank_to_null($_POST['notes'])]);
        });
    } elseif ($a === 'sign_out') {
        handle('Signed out.', function () {
            // GREATEST(...) keeps time_out strictly after time_in even if you click within the same second.
            run('UPDATE attendance SET time_out = GREATEST(NOW(), time_in + INTERVAL 1 SECOND)
                 WHERE attendance_id = ? AND time_out IS NULL', [$_POST['attendance_id']]);
        });
    }
    redirect('attendance.php');
}

page_header('Attendance');
?>
<fieldset><legend>Sign in</legend>
  <form method="post">
    <input type="hidden" name="action" value="sign_in">
    Person <select name="person_id"><?= options(person_labels(), 'person_id', 'label') ?></select>
    Purpose <select name="purpose_id"><?= options(rows('SELECT purpose_id, name FROM purpose ORDER BY name'), 'purpose_id', 'name') ?></select>
    Notes <input name="notes">
    <br>
    Time in (optional) <input type="datetime-local" name="time_in">
    Time out (optional) <input type="datetime-local" name="time_out">
    <button>Sign in</button>
  </form>
  <small>Visitors and members use the same form. Set time out earlier than time in to test the CHECK.</small>
</fieldset>

<h2>Log (latest 100)</h2>
<?php
$log = rows("SELECT a.attendance_id, p.first_name, p.last_name, p.student_id,
                    CASE WHEN m.person_id IS NULL THEN 'Visitor' ELSE 'Member' END AS kind,
                    pu.name AS purpose, a.time_in, a.time_out, a.notes
             FROM attendance a
             JOIN person p ON p.person_id = a.person_id
             LEFT JOIN member m ON m.person_id = p.person_id
             JOIN purpose pu ON pu.purpose_id = a.purpose_id
             ORDER BY a.time_in DESC, a.attendance_id DESC LIMIT 100");
if (!$log) { echo '<p><em>(no rows)</em></p>'; }
else { ?>
<table>
  <tr><th>id</th><th>first</th><th>last</th><th>student_id</th><th>kind</th><th>purpose</th>
      <th>time_in</th><th>time_out</th><th>notes</th><th></th></tr>
  <?php foreach ($log as $r): ?>
  <tr>
    <?php foreach ($r as $v): ?>
      <td><?= $v === null ? '<span class="null">NULL</span>' : h($v) ?></td>
    <?php endforeach; ?>
    <td>
      <?php if ($r['time_out'] === null): ?>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="sign_out">
        <input type="hidden" name="attendance_id" value="<?= h($r['attendance_id']) ?>">
        <button>Sign out</button>
      </form>
      <?php endif; ?>
    </td>
  </tr>
  <?php endforeach; ?>
</table>
<?php }
page_footer();
