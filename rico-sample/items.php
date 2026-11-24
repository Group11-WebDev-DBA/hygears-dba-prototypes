<?php
require __DIR__ . '/lib.php';

if (is_post()) {
    $a = $_POST['action'] ?? '';
    if ($a === 'add_item') {
        handle('Item added.', function () {
            run('INSERT INTO item (category_id, name, item_type, quantity_total, reorder_level) VALUES (?,?,?,?,?)',
                [$_POST['category_id'], trim($_POST['name']), $_POST['item_type'],
                 $_POST['quantity_total'], blank_to_null($_POST['reorder_level'])]);
        });
    } elseif ($a === 'restock') {
        handle('Restock recorded.', function () {
            run('INSERT INTO restock (item_id, quantity, restocked_on, notes) VALUES (?,?,?,?)',
                [$_POST['item_id'], $_POST['quantity'], $_POST['restocked_on'], blank_to_null($_POST['notes'])]);
        });
    } elseif ($a === 'toggle_active') {
        handle('Active flag toggled.', function () {
            run('UPDATE item SET is_active = NOT is_active WHERE item_id = ?', [$_POST['item_id']]);
        });
    }
    redirect('items.php');
}

page_header('Items & Stock');
$categories = rows('SELECT category_id, name FROM category ORDER BY name');
$items      = rows('SELECT item_id, name FROM item ORDER BY name');
?>
<fieldset><legend>Add item</legend>
  <form method="post">
    <input type="hidden" name="action" value="add_item">
    Category <select name="category_id"><?= options($categories, 'category_id', 'name') ?></select>
    Name <input name="name" required>
    Type <select name="item_type"><option>tool</option><option>consumable</option></select>
    Quantity <input type="number" name="quantity_total" min="0" value="1" required>
    Reorder level <input type="number" name="reorder_level" min="0" placeholder="optional">
    <button>Add item</button>
  </form>
</fieldset>

<fieldset><legend>Restock</legend>
  <form method="post">
    <input type="hidden" name="action" value="restock">
    Item <select name="item_id"><?= options($items, 'item_id', 'name') ?></select>
    Quantity <input type="number" name="quantity" value="1" required>
    Date <input type="date" name="restocked_on" value="<?= date('Y-m-d') ?>" required>
    Notes <input name="notes">
    <button>Restock</button>
  </form>
  <small>Quantity 0 should be rejected by the CHECK.</small>
</fieldset>

<h2>Items with calculated availability (v_item_stock)</h2>
<?php
$list = rows("SELECT i.item_id, i.name, c.name AS category, i.item_type, i.quantity_total, i.reorder_level,
                     i.is_active, s.quantity_available
              FROM item i
              JOIN category c ON c.category_id = i.category_id
              JOIN v_item_stock s ON s.item_id = i.item_id
              ORDER BY i.name");
if (!$list) { echo '<p><em>(no rows)</em></p>'; }
else { ?>
<table>
  <tr><th>id</th><th>name</th><th>category</th><th>type</th><th>quantity_total</th><th>reorder_level</th>
      <th>active</th><th>quantity_available</th><th></th></tr>
  <?php foreach ($list as $r): ?>
  <tr>
    <?php foreach ($r as $v): ?>
      <td><?= $v === null ? '<span class="null">NULL</span>' : h($v) ?></td>
    <?php endforeach; ?>
    <td>
      <form method="post" class="inline">
        <input type="hidden" name="action" value="toggle_active">
        <input type="hidden" name="item_id" value="<?= h($r['item_id']) ?>">
        <button>Toggle active</button>
      </form>
    </td>
  </tr>
  <?php endforeach; ?>
</table>
<?php } ?>

<h2>Restock history</h2>
<?php
render_table(rows('SELECT r.restock_id, i.name AS item, r.quantity, r.restocked_on, r.notes
                   FROM restock r JOIN item i ON i.item_id = r.item_id ORDER BY r.restocked_on DESC, r.restock_id DESC'));
page_footer();
