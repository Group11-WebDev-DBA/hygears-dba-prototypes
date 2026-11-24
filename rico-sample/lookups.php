<?php
require __DIR__ . '/lib.php';

if (is_post()) {
    $a = $_POST['action'] ?? '';
    if ($a === 'add_role') {
        handle('Role added.', function () {
            run('INSERT INTO role (name, can_approve) VALUES (?, ?)',
                [trim($_POST['name']), isset($_POST['can_approve']) ? 1 : 0]);
        });
    } elseif ($a === 'add_purpose') {
        handle('Purpose added.', function () {
            run('INSERT INTO purpose (name) VALUES (?)', [trim($_POST['name'])]);
        });
    } elseif ($a === 'add_category') {
        handle('Category added.', function () {
            run('INSERT INTO category (name) VALUES (?)', [trim($_POST['name'])]);
        });
    }
    redirect('lookups.php');
}

page_header('Roles / Purposes / Categories');
?>
<fieldset><legend>Roles</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_role">
    Name <input name="name" required>
    <label><input type="checkbox" name="can_approve"> can approve requests</label>
    <button>Add role</button>
  </form>
  <?php render_table(rows('SELECT * FROM role ORDER BY role_id')); ?>
</fieldset>

<fieldset><legend>Purposes</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_purpose">
    Name <input name="name" required> <button>Add purpose</button>
  </form>
  <?php render_table(rows('SELECT * FROM purpose ORDER BY purpose_id')); ?>
</fieldset>

<fieldset><legend>Categories</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_category">
    Name <input name="name" required> <button>Add category</button>
  </form>
  <?php render_table(rows('SELECT * FROM category ORDER BY category_id')); ?>
</fieldset>
<?php page_footer();
