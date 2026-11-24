<?php
// Shared helpers for the test app. No framework, no classes.
// WARNING: for testing only. There is no login, and DB errors are shown on screen on purpose.

require __DIR__ . '/config.php';

ini_set('display_errors', '1');
error_reporting(E_ALL);
session_start();

set_exception_handler(function ($e) {
    echo '<pre style="color:#b00">Unhandled error: ' . h($e->getMessage()) . '</pre>';
});

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function run($sql, $params = []) {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}
function rows($sql, $params = []) { return run($sql, $params)->fetchAll(); }
function one($sql, $params = [])  { $r = rows($sql, $params); return $r ? $r[0] : null; }

function h($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function blank_to_null($v) { $v = trim((string)$v); return $v === '' ? null : $v; }
function dt($v) { $v = blank_to_null($v); return $v === null ? null : str_replace('T', ' ', $v); }
function is_post() { return $_SERVER['REQUEST_METHOD'] === 'POST'; }
function redirect($url) { header('Location: ' . $url); exit; }
function flash($type, $msg) { $_SESSION['flash'][] = [$type, $msg]; }

// Run a database action; show the success message or the raw DB error (so you can see
// exactly which constraint or trigger fired).
function handle($okMessage, $fn) {
    try { $fn(); flash('ok', $okMessage); }
    catch (Throwable $e) { flash('error', $e->getMessage()); }
}

function options($rows, $valueKey, $labelKey, $selected = null, $blankLabel = null) {
    $out = '';
    if ($blankLabel !== null) $out .= '<option value="">' . h($blankLabel) . '</option>';
    foreach ($rows as $r) {
        $sel = ((string)$r[$valueKey] === (string)$selected) ? ' selected' : '';
        $out .= '<option value="' . h($r[$valueKey]) . '"' . $sel . '>' . h($r[$labelKey]) . '</option>';
    }
    return $out;
}

function render_table($rows) {
    if (!$rows) { echo '<p><em>(no rows)</em></p>'; return; }
    echo '<table><tr>';
    foreach (array_keys($rows[0]) as $col) echo '<th>' . h($col) . '</th>';
    echo '</tr>';
    foreach ($rows as $r) {
        echo '<tr>';
        foreach ($r as $v) echo '<td>' . ($v === null ? '<span class="null">NULL</span>' : h($v)) . '</td>';
        echo '</tr>';
    }
    echo '</table>';
}

function page_header($title) {
    $nav = [
        'index.php'      => 'Dashboard',
        'lookups.php'    => 'Roles / Purposes / Categories',
        'people.php'     => 'People',
        'attendance.php' => 'Attendance',
        'items.php'      => 'Items & Stock',
        'requests.php'   => 'Requests',
    ];
    echo '<!doctype html><html><head><meta charset="utf-8"><title>' . h($title) . '</title><style>
      body{font-family:sans-serif;margin:1em 2em}
      table{border-collapse:collapse;margin:.5em 0}
      td,th{border:1px solid #999;padding:2px 8px;text-align:left}
      fieldset{margin:1em 0;padding:.5em 1em}
      form{margin:.3em 0}
      .inline{display:inline}
      .ok{color:#060;font-weight:bold}
      .error{color:#b00;font-weight:bold;white-space:pre-wrap}
      .null{color:#999}
    </style></head><body><p>';
    $links = [];
    foreach ($nav as $file => $label) $links[] = '<a href="' . $file . '">' . h($label) . '</a>';
    echo implode(' | ', $links) . '</p>';
    if (!empty($_SESSION['flash'])) {
        foreach ($_SESSION['flash'] as $f) echo '<p class="' . h($f[0]) . '">' . h($f[1]) . '</p>';
        $_SESSION['flash'] = [];
    }
    echo '<h1>' . h($title) . '</h1>';
}

function page_footer() { echo '</body></html>'; }

// Dropdown source lists
function person_labels() {
    return rows("SELECT person_id, CONCAT(last_name, ', ', first_name, ' (', COALESCE(student_id, 'no ID'), ')') AS label
                 FROM person ORDER BY last_name, first_name");
}
function member_labels() {
    return rows("SELECT p.person_id, CONCAT(p.last_name, ', ', p.first_name, ' [', r.name,
                        IF(r.can_approve, ', can approve', ''), IF(m.is_active, '', ', INACTIVE'), ']') AS label
                 FROM member m JOIN person p ON p.person_id = m.person_id JOIN role r ON r.role_id = m.role_id
                 ORDER BY p.last_name, p.first_name");
}
