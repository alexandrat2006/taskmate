-- TaskMate database schema (MySQL 8+)
CREATE DATABASE IF NOT EXISTS taskmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskmate;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(120) NOT NULL,
  color      CHAR(7) NOT NULL DEFAULT '#3B6FD4',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_course_user (user_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name    VARCHAR(60) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_category_user (user_id, name)
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  course_id   INT NULL,
  category_id INT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT NULL,
  deadline    DATE NULL,
  priority    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status      ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (course_id)   REFERENCES courses(id)    ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_tasks_user_deadline (user_id, deadline),
  INDEX idx_tasks_user_status (user_id, status)
);
