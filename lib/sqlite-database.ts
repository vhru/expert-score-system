import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 确保数据库目录存在
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'expert_review.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

export default db;

// 初始化数据库表
export async function initDatabase() {
  try {
    // 创建用户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'expert' CHECK (role IN ('admin', 'expert')),
        encrypted_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建文件表
    db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        encrypted_info TEXT,
        upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建评审分配表
    db.exec(`
      CREATE TABLE IF NOT EXISTS review_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        expert_id INTEGER NOT NULL,
        assignment_status TEXT DEFAULT 'assigned' CHECK (assignment_status IN ('assigned', 'in_progress', 'completed')),
        score REAL,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
        FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(file_id, expert_id)
      )
    `);

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_files_status ON files(upload_status);
      CREATE INDEX IF NOT EXISTS idx_assignments_expert ON review_assignments(expert_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_status ON review_assignments(assignment_status);
    `);

    // 创建管理员用户
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, role) 
      VALUES (?, ?, 'admin')
    `);
    stmt.run(process.env.ADMIN_EMAIL || 'admin@example.com', adminPassword);

    // SQLite database initialized successfully
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// 数据库操作封装
export const dbOperations = {
  // 用户操作
  users: {
    findByUsername: (username: string) => {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      return stmt.get(username);
    },
    
    create: (username: string, password: string, role: string, encryptedInfo?: string) => {
      const stmt = db.prepare(`
        INSERT INTO users (username, password, role, encrypted_info) 
        VALUES (?, ?, ?, ?)
      `);
      return stmt.run(username, password, role, encryptedInfo);
    },
    
    findAll: () => {
      const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
      return stmt.all();
    }
  },
  
  // 文件操作
  files: {
    create: (originalName: string, filePath: string, fileSize: number, mimeType: string, encryptedInfo?: string) => {
      const stmt = db.prepare(`
        INSERT INTO files (original_name, file_path, file_size, mime_type, encrypted_info) 
        VALUES (?, ?, ?, ?, ?)
      `);
      return stmt.run(originalName, filePath, fileSize, mimeType, encryptedInfo);
    },
    
    findById: (id: number) => {
      const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
      return stmt.get(id);
    },
    
    findAll: () => {
      const stmt = db.prepare('SELECT * FROM files ORDER BY created_at DESC');
      return stmt.all();
    },
    
    updateStatus: (id: number, status: string) => {
      const stmt = db.prepare('UPDATE files SET upload_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      return stmt.run(status, id);
    }
  },
  
  // 评审分配操作
  assignments: {
    create: (fileId: number, expertId: number) => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO review_assignments (file_id, expert_id) 
        VALUES (?, ?)
      `);
      return stmt.run(fileId, expertId);
    },
    
    findByExpert: (expertId: number) => {
      const stmt = db.prepare(`
        SELECT ra.*, f.original_name, f.file_path, f.mime_type
        FROM review_assignments ra
        JOIN files f ON ra.file_id = f.id
        WHERE ra.expert_id = ? AND f.upload_status = 'completed'
        ORDER BY ra.created_at DESC
      `);
      return stmt.all(expertId);
    },
    
    findAll: () => {
      const stmt = db.prepare(`
        SELECT 
          ra.id,
          ra.file_id,
          ra.expert_id,
          ra.assignment_status,
          ra.score,
          ra.comments,
          ra.created_at,
          ra.updated_at,
          f.original_name,
          u.username as expert_name
        FROM review_assignments ra
        JOIN files f ON ra.file_id = f.id
        JOIN users u ON ra.expert_id = u.id
        ORDER BY ra.created_at DESC
      `);
      return stmt.all();
    },
    
    updateScore: (id: number, score: number, comments: string) => {
      const stmt = db.prepare(`
        UPDATE review_assignments 
        SET score = ?, comments = ?, assignment_status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(score, comments, id);
    },
    
    getStatistics: () => {
      const stmt = db.prepare(`
        SELECT 
          COUNT(*) as total_assignments,
          SUM(CASE WHEN assignment_status = 'assigned' THEN 1 ELSE 0 END) as pending_reviews,
          SUM(CASE WHEN assignment_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_reviews,
          SUM(CASE WHEN assignment_status = 'completed' THEN 1 ELSE 0 END) as completed_reviews,
          AVG(CASE WHEN assignment_status = 'completed' THEN score ELSE NULL END) as average_score
        FROM review_assignments
      `);
      return stmt.get();
    }
  }
};
