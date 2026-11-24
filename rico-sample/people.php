<?php
require __DIR__ . '/lib.php';

if (is_post()) {
    $a = $_POST['action'] ?? '';
    if ($a === 'add_person') {
        handle('Person added.', function () {
            run('INSERT INTO person (student_id, first_name, last_name, contact_number, affiliation) VALUES (?,?,?,?,?)',
                [blank_to_null($_POST['student_id']), trim($_POST['first_name']), trim($_POST['last_name']),
                 trim($_POST['contact_number']), blank_to_null($_POST['affiliation'])]);
        });
    } elseif ($a === 'add_member') {
        handle('Member added.', function () {
            run('INSERT INTO member (person_id, role_id, email, is_active, joined_on) VALUES (?,?,?,?,?)',
                [$_POST['person_id'], $_POST['role_id'], blank_to_null($_POST['email']),
                 isset($_POST['is_active']) ? 1 : 0, $_POST['joined_on']]);
        });
    } elseif ($a === 'clear_student_id') {
        handle('Student ID cleared.', function () {
            run('UPDATE person SET student_id = NULL WHERE person_id = ?', [$_POST['person_id']]);
        });
    } elseif ($a === 'toggle_active') {
        handle('Active flag toggled.', function () {
            run('UPDATE member SET is_active = NOT is_active WHERE person_id = ?', [$_POST['person_id']]);
        });
    } elseif ($a === 'change_role') {
        handle('Role changed.', function () {
            run('UPDATE member SET role_id = ? WHERE person_id = ?', [$_POST['role_id'], $_POST['person_id']]);
        });
    }
    redirect('people.php');
}

page_header('People');
$roles = rows('SELECT role_id, name FROM role ORDER BY role_id');
?>
<fieldset><legend>Add a person (visitor or future member)</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_person">
    Student ID <input name="student_id" placeholder="blank for outsiders">
    First name <input name="first_name" required>
    Last name <input name="last_name" required>
    Contact <input name="contact_number" required>
    Affiliation <input name="affiliation" placeholder="optional">
    <button>Add person</button>
  </form>
</fieldset>

<fieldset><legend>Make an existing person a member</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_member">
    Person <select name="person_id"><?= options(person_labels(), 'person_id', 'label') ?></select>
    Role <select name="role_id"><?= options($roles, 'role_id', 'name') ?></select>
    Email <input name="email" placeholder="optional">
    Joined <input type="date" name="joined_on" value="<?= date('Y-m-d') ?>" required>
    <label><input type="checkbox" name="is_active" checked> active</label>
    <button>Add member</button>
  </form>
  <small>Try it with a person who has no student ID: the trigger should refuse.</small>
</fieldset>

<h2>All people</h2>
<?php
$people = rows("SELECT p.person_id, p.student_id, p.first_name, p.last_name, p.contact_number, p.affiliation,
                       CASE WHEN m.person_id IS NULL THEN 'Visitor' ELSE 'Member' END AS kind,
                       m.role_id, r.name AS role, r.can_approve, m.is_active
                FROM person p
                LEFT JOIN member m ON m.person_id = p.person_id
                LEFT JOIN role r ON r.role_id = m.role_id
                ORDER BY p.person_id");
if (!$people) { echo '<p><em>(no rows)</em></p>'; }
else { ?>
<table>
  <tr><th>id</th><th>student_id</th><th>first</th><th>last</th><th>contact</th><th>affiliation</th>
      <th>kind</th><th>role</th><th>can_approve</th><th>active</th><th>test actions</th></tr>
  <?php foreach ($people as $p): ?>
  <tr>
    <td><?= h($p['person_id']) ?></td>
    <td><?= $p['student_id'] === null ? '<span class="null">NULL</span>' : h($p['student_id']) ?></td>
    <td><?= h($p['first_name']) ?></td>
    <td><?= h($p['last_name']) ?></td>
    <td><?= h($p['contact_number']) ?></td>
    <td><?= $p['affiliation'] === null ? '<span class="null">NULL</span>' : h($p['affiliation']) ?></td>
    <td><?= h($p['kind']) ?></td>
    <td><?= h($p['role']) ?></td>
    <td><?= $p['kind'] === 'Member' ? h($p['can_approve']) : '' ?></td>
    <td><?= $p['kind'] === 'Member' ? h($p['is_active']) : '' ?></td>
    <td>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="clear_student_id">
        <input type="hidden" name="person_id" value="<?= h($p['person_id']) ?>">
        <button>Clear student ID</button>
      </form>
      <?php if ($p['kind'] === 'Member'): ?>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="toggle_active">
        <input type="hidden" name="person_id" value="<?= h($p['person_id']) ?>">
        <button>Toggle active</button>
      </form>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="change_role">
        <input type="hidden" name="person_id" value="<?= h($p['person_id']) ?>">
        <select name="role_id"><?= options($roles, 'role_id', 'name', $p['role_id']) ?></select>
        <button>Set role</button>
      </form>
      <?php endif; ?>
    </td>
  </tr>
  <?php endforeach; ?>
</table>
<?php }
page_footer();
