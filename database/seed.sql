-- Optional demo data. Run AFTER registering a user (the first user has id = 1):
--   mysql -u root -p taskmate < database/seed.sql
USE taskmate;

INSERT IGNORE INTO courses (user_id, name, color) VALUES
  (1, 'Databases', '#3B6FD4'),
  (1, 'Web Development', '#2F8F5B'),
  (1, 'English', '#D6623F');

INSERT INTO tasks (user_id, course_id, category_id, title, description, deadline, priority, status) VALUES
  (1, (SELECT id FROM courses WHERE user_id=1 AND name='Databases'),
      (SELECT id FROM categories WHERE user_id=1 AND name='Lab'),
      'Lab 5: normalization', 'Bring the ER diagram.', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'high', 'in_progress'),
  (1, (SELECT id FROM courses WHERE user_id=1 AND name='English'),
      (SELECT id FROM categories WHERE user_id=1 AND name='Homework'),
      'Essay draft', NULL, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'medium', 'todo'),
  (1, (SELECT id FROM courses WHERE user_id=1 AND name='Web Development'),
      (SELECT id FROM categories WHERE user_id=1 AND name='Project'),
      'Final project: REST API', 'Auth + CRUD + README.', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'high', 'todo');
