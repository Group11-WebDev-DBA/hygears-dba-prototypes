DROP DATABASE IF EXISTS hygears_db;
CREATE DATABASE hygears_db;
USE hygears_db;


--  PEOPLE AND ROLES
-- Anyone who signs the attendance log (members and visitors).
-- A visitor = person with no row in `member`.
CREATE TABLE person (
  person_id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id     VARCHAR(20)   NULL,          -- empty for visitors that are not pupian
  first_name     VARCHAR(50)   NOT NULL,
  last_name      VARCHAR(50)   NOT NULL,
  contact_number VARCHAR(20)   NOT NULL,
  affiliation    VARCHAR(100)  NULL,          -- outsider's affiliation i.e, their school or whatever
  PRIMARY KEY (person_id),
  UNIQUE KEY uq_person_student_id (student_id),  
  KEY idx_person_name (last_name, first_name)
);

CREATE TABLE role (
  role_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(30)  NOT NULL,
  can_approve BOOLEAN      NOT NULL DEFAULT FALSE,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_role_name (name)
);

-- club members specialization.
CREATE TABLE member (
  person_id INT UNSIGNED NOT NULL,            -- same value as person.person_id
  role_id   INT UNSIGNED NOT NULL,
  email     VARCHAR(100) NULL,
  is_active BOOLEAN      NOT NULL DEFAULT TRUE,
  joined_on DATE         NOT NULL,
  PRIMARY KEY (person_id),
  KEY idx_member_role (role_id),
  CONSTRAINT fk_member_person FOREIGN KEY (person_id) REFERENCES person (person_id),
  CONSTRAINT fk_member_role   FOREIGN KEY (role_id)   REFERENCES role (role_id)
);

--  ATTENDANCE
CREATE TABLE purpose (
  purpose_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)  NOT NULL,
  PRIMARY KEY (purpose_id),
  UNIQUE KEY uq_purpose_name (name)
);

CREATE TABLE attendance (
  attendance_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id     INT UNSIGNED NOT NULL,
  purpose_id    INT UNSIGNED NOT NULL,
  time_in       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  time_out      DATETIME     NULL,            -- NULL while the person hasn't signed out or left
  notes         VARCHAR(255) NULL,
  PRIMARY KEY (attendance_id),
  KEY idx_attendance_person  (person_id),
  KEY idx_attendance_purpose (purpose_id),
  KEY idx_attendance_time_in (time_in),
  CONSTRAINT fk_attendance_person  FOREIGN KEY (person_id)  REFERENCES person (person_id),
  CONSTRAINT fk_attendance_purpose FOREIGN KEY (purpose_id) REFERENCES purpose (purpose_id),
  CONSTRAINT chk_attendance_times  CHECK (time_out IS NULL OR time_out > time_in)
);

--  INVENTORY
CREATE TABLE category (
  category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)  NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_category_name (name)
);

CREATE TABLE item (
  item_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id    INT UNSIGNED NOT NULL,
  name           VARCHAR(100) NOT NULL,
  item_type      ENUM('tool', 'consumable') NOT NULL,
  quantity_total INT UNSIGNED NOT NULL DEFAULT 0,  -- tools: units owned; consumables: stock
  reorder_level  INT UNSIGNED NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (item_id),
  UNIQUE KEY uq_item_name (name),
  KEY idx_item_category (category_id),
  CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES category (category_id)
);

CREATE TABLE restock (
  restock_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id      INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  restocked_on DATE         NOT NULL,
  notes        VARCHAR(255) NULL,
  PRIMARY KEY (restock_id),
  KEY idx_restock_item (item_id),
  CONSTRAINT fk_restock_item FOREIGN KEY (item_id) REFERENCES item (item_id),
  CONSTRAINT chk_restock_qty CHECK (quantity > 0)
);

--  REQUESTS (borrowing tools / taking consumables)
CREATE TABLE item_request (
  request_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  requested_by INT UNSIGNED NOT NULL,         -- must be a member
  decided_by   INT UNSIGNED NULL,             -- approver, NULL while pending
  requested_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at   DATETIME     NULL,
  status       ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  remarks      VARCHAR(255) NULL,
  PRIMARY KEY (request_id),
  KEY idx_request_requested_by (requested_by),
  KEY idx_request_decided_by   (decided_by),
  KEY idx_request_status       (status),
  CONSTRAINT fk_request_requested_by FOREIGN KEY (requested_by) REFERENCES member (person_id),
  CONSTRAINT fk_request_decided_by   FOREIGN KEY (decided_by)   REFERENCES member (person_id),
  -- so nobody approves their own request
  CONSTRAINT chk_request_not_self CHECK (decided_by IS NULL OR decided_by <> requested_by),
  -- pending = no decision yet, anything else = decider and time are recorded
  CONSTRAINT chk_request_decision CHECK (
       (status = 'pending' AND decided_by IS NULL     AND decided_at IS NULL)
    OR (status <> 'pending' AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
  ),
  CONSTRAINT chk_request_decided_after CHECK (decided_at IS NULL OR decided_at >= requested_at)
);

CREATE TABLE request_line (
  line_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id  INT UNSIGNED NOT NULL,
  item_id     INT UNSIGNED NOT NULL,
  quantity    INT UNSIGNED NOT NULL,
  due_date    DATE         NULL,              -- tools only
  returned_at DATETIME     NULL,              -- tools only, NULL until returned
  PRIMARY KEY (line_id),
  UNIQUE KEY uq_line_request_item (request_id, item_id),   -- one line per item per request
  KEY idx_line_item (item_id),
  CONSTRAINT fk_line_request FOREIGN KEY (request_id) REFERENCES item_request (request_id),
  CONSTRAINT fk_line_item    FOREIGN KEY (item_id)    REFERENCES item (item_id),
  CONSTRAINT chk_line_qty    CHECK (quantity > 0)
);

--  TRIGGERS, for additional checks 

DELIMITER $$

-- A member must have a student ID.
CREATE TRIGGER trg_member_requires_student_id_ins
BEFORE INSERT ON member
FOR EACH ROW
BEGIN
  IF (SELECT student_id FROM person WHERE person_id = NEW.person_id) IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A club member must have a student ID.';
  END IF;
END$$

-- Person who is already a member cannot lose their student ID.
CREATE TRIGGER trg_person_keep_student_id_upd
BEFORE UPDATE ON person
FOR EACH ROW
BEGIN
  IF NEW.student_id IS NULL
     AND EXISTS (SELECT 1 FROM member WHERE person_id = NEW.person_id) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot remove the student ID of a club member.';
  END IF;
END$$

-- Only a member whose role has can_approve = TRUE may decide a request.
CREATE TRIGGER trg_request_approver_ins
BEFORE INSERT ON item_request
FOR EACH ROW
BEGIN
  IF NEW.decided_by IS NOT NULL
     AND NOT EXISTS (SELECT 1
                     FROM member m JOIN role r ON r.role_id = m.role_id
                     WHERE m.person_id = NEW.decided_by
                       AND m.is_active = TRUE
                       AND r.can_approve = TRUE) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'decided_by must be an active member whose role can approve requests.';
  END IF;
END$$

CREATE TRIGGER trg_request_approver_upd
BEFORE UPDATE ON item_request
FOR EACH ROW
BEGIN
  IF NEW.decided_by IS NOT NULL
     AND NOT EXISTS (SELECT 1
                     FROM member m JOIN role r ON r.role_id = m.role_id
                     WHERE m.person_id = NEW.decided_by
                       AND m.is_active = TRUE
                       AND r.can_approve = TRUE) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'decided_by must be an active member whose role can approve requests.';
  END IF;
END$$

-- Consumables are never returned, so they carry no due date or return time.
CREATE TRIGGER trg_line_consumable_ins
BEFORE INSERT ON request_line
FOR EACH ROW
BEGIN
  IF (NEW.due_date IS NOT NULL OR NEW.returned_at IS NOT NULL)
     AND (SELECT item_type FROM item WHERE item_id = NEW.item_id) = 'consumable' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Consumables cannot have a due date or return time.';
  END IF;
END$$

CREATE TRIGGER trg_line_consumable_upd
BEFORE UPDATE ON request_line
FOR EACH ROW
BEGIN
  IF (NEW.due_date IS NOT NULL OR NEW.returned_at IS NOT NULL)
     AND (SELECT item_type FROM item WHERE item_id = NEW.item_id) = 'consumable' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Consumables cannot have a due date or return time.';
  END IF;
END$$

DELIMITER ;

--  VIEWS: calculated values (not stored, so they never drift)

-- Current quantity available for every item.
--   tool:       quantity_total - units currently out (not yet returned)
--   consumable: quantity_total + restocks - everything issued
CREATE VIEW v_item_stock AS
SELECT
  i.item_id,
  i.name,
  i.item_type,
  i.reorder_level,
  i.is_active,
  CASE
    WHEN i.item_type = 'consumable'
      THEN CAST(i.quantity_total AS SIGNED) + COALESCE(r.restocked, 0) - COALESCE(l.issued, 0)
    ELSE CAST(i.quantity_total AS SIGNED) - COALESCE(l.out_qty, 0)
  END AS quantity_available
FROM item i
LEFT JOIN (
  SELECT item_id, SUM(quantity) AS restocked
  FROM restock
  GROUP BY item_id
) r ON r.item_id = i.item_id
LEFT JOIN (
  SELECT rl.item_id,
         SUM(rl.quantity) AS issued,
         SUM(CASE WHEN rl.returned_at IS NULL THEN rl.quantity ELSE 0 END) AS out_qty
  FROM request_line rl
  JOIN item_request q ON q.request_id = rl.request_id
  WHERE q.status IN ('approved', 'completed')
  GROUP BY rl.item_id
) l ON l.item_id = i.item_id;

-- Active items at or below their reorder level.
CREATE VIEW v_low_stock AS
SELECT item_id, name, item_type, quantity_available, reorder_level
FROM v_item_stock
WHERE is_active = TRUE
  AND reorder_level IS NOT NULL
  AND quantity_available <= reorder_level;

-- Tools that are currently out, with who has them and whether they are overdue.
CREATE VIEW v_open_loans AS
SELECT
  rl.line_id,
  q.request_id,
  p.first_name,
  p.last_name,
  p.student_id,
  p.contact_number,
  i.name AS item_name,
  rl.quantity,
  q.decided_at AS borrowed_at,
  rl.due_date,
  (rl.due_date < CURDATE()) AS is_overdue
FROM request_line rl
JOIN item_request q ON q.request_id = rl.request_id
JOIN person p       ON p.person_id  = q.requested_by
JOIN item i         ON i.item_id    = rl.item_id
WHERE i.item_type = 'tool'
  AND q.status = 'approved'
  AND rl.returned_at IS NULL;

--  starter data

INSERT INTO role (name, can_approve) VALUES
  ('Member',    FALSE),
  ('Officer',   TRUE),
  ('President', TRUE),
  ('Adviser',   TRUE);

INSERT INTO purpose (name) VALUES
  ('Meeting'),
  ('Project work'),
  ('Workshop'),
  ('Tool use'),
  ('Study'),
  ('Visit');

INSERT INTO category (name) VALUES
  ('Hand tools'),
  ('Power tools'),
  ('Electronics'),
  ('Measuring instruments'),
  ('Cutting consumables'),
  ('Soldering consumables');
