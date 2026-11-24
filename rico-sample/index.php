<?php
require __DIR__ . '/lib.php';
page_header('Dashboard');

echo '<h2>Row counts</h2><table><tr><th>table</th><th>rows</th></tr>';
foreach (['person','member','role','purpose','attendance','category','item','restock','item_request','request_line'] as $t) {
    $c = one("SELECT COUNT(*) AS c FROM $t");
    echo '<tr><td>' . $t . '</td><td>' . $c['c'] . '</td></tr>';
}
echo '</table>';

echo '<h2>Inside the club room now (attendance.time_out IS NULL)</h2>';
render_table(rows("SELECT p.first_name, p.last_name, pu.name AS purpose, a.time_in
                   FROM attendance a JOIN person p ON p.person_id = a.person_id
                   JOIN purpose pu ON pu.purpose_id = a.purpose_id
                   WHERE a.time_out IS NULL ORDER BY a.time_in"));

echo '<h2>Stock (view: v_item_stock)</h2>';
render_table(rows('SELECT * FROM v_item_stock ORDER BY name'));

echo '<h2>Low stock (view: v_low_stock)</h2>';
render_table(rows('SELECT * FROM v_low_stock'));

echo '<h2>Tools currently out (view: v_open_loans)</h2>';
render_table(rows('SELECT * FROM v_open_loans ORDER BY due_date'));

page_footer();
