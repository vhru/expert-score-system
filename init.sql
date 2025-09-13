-- 初始化数据库脚本
CREATE DATABASE IF NOT EXISTS expert_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE expert_review;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'expert') NOT NULL DEFAULT 'expert',
  encrypted_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建文件表
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  encrypted_info TEXT,
  upload_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建评审分配表
CREATE TABLE IF NOT EXISTS review_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  expert_id INT NOT NULL,
  assignment_status ENUM('assigned', 'in_progress', 'completed') DEFAULT 'assigned',
  score DECIMAL(5,2),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (file_id, expert_id)
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_files_status ON files(upload_status);
CREATE INDEX idx_assignments_expert ON review_assignments(expert_id);
CREATE INDEX idx_assignments_status ON review_assignments(assignment_status);
