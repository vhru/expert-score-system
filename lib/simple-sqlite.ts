import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// 确保数据库目录存在
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'expert_review.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 初始化数据库表
export async function initDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // 创建用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'expert' CHECK (role IN ('admin', 'expert')),
          encrypted_info TEXT,
          expert_type TEXT DEFAULT 'team',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建文件表
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          encrypted_info TEXT,
          upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
          team_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建团队表
      db.run(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_name TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          contact_email TEXT UNIQUE NOT NULL,
          encrypted_info TEXT,
          is_enterprise BOOLEAN DEFAULT 0,
          enterprise_name TEXT,
          enterprise_license TEXT,
          project_stage TEXT,
          project_stage_others TEXT,
          nationality_type TEXT DEFAULT 'single' CHECK (nationality_type IN ('single', 'multiple')),
          selected_countries TEXT,
          nationality_others TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          audit_status TEXT DEFAULT 'pending' CHECK (audit_status IN ('pending', 'approved', 'rejected')),
          audit_notes TEXT,
          audited_at DATETIME,
          audited_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 创建团队图片表
      db.run(`
        CREATE TABLE IF NOT EXISTS team_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          image_name TEXT NOT NULL,
          image_path TEXT NOT NULL,
          image_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          encrypted_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )
      `);

      // 创建核心成员表
      db.run(`
        CREATE TABLE IF NOT EXISTS core_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          member_order INTEGER NOT NULL,
          name TEXT NOT NULL,
          nationality TEXT,
          gender TEXT,
          birth_date TEXT,
          id_type TEXT,
          id_number TEXT,
          phone TEXT,
          email TEXT,
          university TEXT,
          highest_degree TEXT,
          organization TEXT,
          position TEXT,
          cv_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )
      `);

      // 创建团队文档表
      db.run(`
        CREATE TABLE IF NOT EXISTS team_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          document_type TEXT NOT NULL,
          document_name TEXT NOT NULL,
          document_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
        )
      `);

      // 创建评审分配表
      db.run(`
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
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_files_status ON files(upload_status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_expert ON review_assignments(expert_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_status ON review_assignments(assignment_status)`);

      // 创建管理员用户
      const bcrypt = require('bcryptjs');
      bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10, (err: any, hash: string) => {
        if (err) {
          console.error('Password hash error:', err);
          reject(err);
          return;
        }

        db.run(`
          INSERT OR IGNORE INTO users (username, password, role, expert_type) 
          VALUES (?, ?, 'admin', 'admin')
        `, [process.env.ADMIN_EMAIL || 'admin@example.com', hash], (err: any) => {
          if (err) {
            console.error('Admin user creation error:', err);
            reject(err);
          } else {
            console.log('SQLite database initialized successfully');
            resolve();
          }
        });
      });
    });
  });
}

// 数据库操作封装
export const dbOperations = {
  // 用户操作
  users: {
    findByUsername: (username: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    create: (username: string, password: string, role: string, encryptedInfo?: string, expertType?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, password, role, encrypted_info, expert_type) VALUES (?, ?, ?, ?, ?)',
          [username, password, role, encryptedInfo, expertType || 'team'],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },
    
    findAll: (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findById: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    update: (id: number, updateData: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];
        
        if (updateData.username) {
          fields.push('username = ?');
          values.push(updateData.username);
        }
        if (updateData.password) {
          fields.push('password = ?');
          values.push(updateData.password);
        }
        if (updateData.encrypted_info !== undefined) {
          fields.push('encrypted_info = ?');
          values.push(updateData.encrypted_info);
        }
        if (updateData.expert_type !== undefined) {
          fields.push('expert_type = ?');
          values.push(updateData.expert_type);
        }
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        
        db.run(sql, values, function(err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    },
    
    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    }
  },
  
  // 团队操作
  teams: {
    create: (teamName: string, password: string, contactEmail: string, encryptedInfo?: string, isEnterprise?: boolean, enterpriseName?: string, enterpriseLicense?: string, projectStage?: string, projectStageOthers?: string, nationalityType?: string, selectedCountries?: string, nationalityOthers?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO teams (team_name, password, contact_email, encrypted_info, is_enterprise, enterprise_name, enterprise_license, project_stage, project_stage_others, nationality_type, selected_countries, nationality_others, audit_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [teamName, password, contactEmail, encryptedInfo, isEnterprise || false, enterpriseName || '', enterpriseLicense || '', projectStage || '', projectStageOthers || '', nationalityType || 'single', selectedCountries || '', nationalityOthers || '', 'pending'],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },
    
    findByName: (teamName: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM teams WHERE team_name = ?', [teamName], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    findByEmail: (email: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM teams WHERE contact_email = ?', [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    findById: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM teams WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    findAll: (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM teams ORDER BY created_at DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    updatePassword: (id: number, password: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE teams SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [password, id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    updateAuditStatus: (id: number, status: string, notes: string, auditedBy: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE teams SET audit_status = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP, audited_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, notes, auditedBy, id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    update: (id: number, data: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        db.run(
          `UPDATE teams SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...values, id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM teams WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    }
  },
  
  // 文件操作
  files: {
    create: (originalName: string, filePath: string, fileSize: number, mimeType: string, encryptedInfo?: string, teamName?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO files (original_name, file_path, file_size, mime_type, encrypted_info, team_name) VALUES (?, ?, ?, ?, ?, ?)',
          [originalName, filePath, fileSize, mimeType, encryptedInfo, teamName],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },
    
    findById: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    findAll: (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM files ORDER BY created_at DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    updateStatus: (id: number, status: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE files SET upload_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    findByTeam: (teamName: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM files WHERE team_name = ?', [teamName], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    }
  },
  
  // 评审分配操作
  assignments: {
    create: (fileId: number, expertId: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO review_assignments (file_id, expert_id) VALUES (?, ?)',
          [fileId, expertId],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },
    
    findByExpert: (expertId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT ra.*, f.original_name, f.file_path, f.mime_type, f.team_name
          FROM review_assignments ra
          JOIN files f ON ra.file_id = f.id
          WHERE ra.expert_id = ? AND f.upload_status = 'completed'
          ORDER BY ra.created_at DESC
        `, [expertId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findByFile: (fileId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT ra.*, u.username as expert_name
          FROM review_assignments ra
          JOIN users u ON ra.expert_id = u.id
          WHERE ra.file_id = ?
          ORDER BY ra.created_at DESC
        `, [fileId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findByExpertAndFile: (expertId: number, fileId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT ra.*, f.original_name, f.file_path, f.mime_type, f.team_name
          FROM review_assignments ra
          JOIN files f ON ra.file_id = f.id
          WHERE ra.expert_id = ? AND ra.file_id = ?
        `, [expertId, fileId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findByExpertAndTeam: (expertId: number, teamName: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT ra.*, f.original_name, f.file_path, f.mime_type, f.team_name
          FROM review_assignments ra
          JOIN files f ON ra.file_id = f.id
          WHERE ra.expert_id = ? AND f.team_name = ?
        `, [expertId, teamName], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findAll: (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all(`
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
            f.team_name,
            u.username as expert_name
          FROM review_assignments ra
          JOIN files f ON ra.file_id = f.id
          JOIN users u ON ra.expert_id = u.id
          ORDER BY ra.created_at DESC
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    updateScore: (id: number, score: number, comments: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(`
          UPDATE review_assignments 
          SET score = ?, comments = ?, assignment_status = 'completed', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [score, comments, id], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    },
    
    getStatistics: (): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_assignments,
            SUM(CASE WHEN assignment_status = 'assigned' THEN 1 ELSE 0 END) as pending_reviews,
            SUM(CASE WHEN assignment_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_reviews,
            SUM(CASE WHEN assignment_status = 'completed' THEN 1 ELSE 0 END) as completed_reviews,
            AVG(CASE WHEN assignment_status = 'completed' THEN score ELSE NULL END) as average_score
          FROM review_assignments
        `, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    updateStatus: (id: number, status: string, score?: number, comments?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(`
          UPDATE review_assignments 
          SET assignment_status = ?, score = ?, comments = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [status, score || null, comments || null, id], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    },
    
    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM review_assignments WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    }
  },
  
  // 团队图片操作
  teamImages: {
    create: (teamId: number, imageName: string, imagePath: string, imageSize: number, mimeType: string, encryptedInfo?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO team_images (team_id, image_name, image_path, image_size, mime_type, encrypted_info) VALUES (?, ?, ?, ?, ?, ?)',
          [teamId, imageName, imagePath, imageSize, mimeType, encryptedInfo],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },
    
    findByTeam: (teamId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM team_images WHERE team_id = ? ORDER BY created_at DESC', [teamId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findById: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM team_images WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    update: (id: number, imagePath: string, imageSize: number, imageName?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE team_images SET image_path = ?, image_size = ?, image_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [imagePath, imageSize, imageName || '', id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM team_images WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    },
  },

  // 核心成员操作
  coreMembers: {
    create: (teamId: number, memberOrder: number, name: string, position: string, nationality: string, idType: string, idNumber: string, cvPath?: string, gender?: string, birthDate?: string, phone?: string, email?: string, university?: string, highestDegree?: string, organization?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO core_members (team_id, member_order, name, position, nationality, id_type, id_number, cv_path, gender, birth_date, phone, email, university, highest_degree, organization) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [teamId, memberOrder || 0, name, position, nationality, idType, idNumber, cvPath || null, gender || null, birthDate || null, phone || null, email || null, university || null, highestDegree || null, organization || null],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },

    findByTeam: (teamId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM core_members WHERE team_id = ? ORDER BY member_order ASC', [teamId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    deleteByTeam: (teamId: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM core_members WHERE team_id = ?', [teamId], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    },

    updateCvPath: (teamId: number, memberOrder: number, cvPath: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE core_members SET cv_path = ? WHERE team_id = ? AND member_order = ?',
          [cvPath, teamId, memberOrder],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },

    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM core_members WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    },
  },

  // 团队文档操作
  teamDocuments: {
    create: (teamId: number, documentType: string, documentPath: string, documentSize: number, documentName?: string, mimeType?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO team_documents (team_id, document_type, document_path, file_size, document_name, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [teamId, documentType, documentPath, documentSize, documentName || '', mimeType || 'application/octet-stream'],
          function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          }
        );
      });
    },

    findByTeam: (teamId: number): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM team_documents WHERE team_id = ? ORDER BY uploaded_at DESC', [teamId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    findById: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM team_documents WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    
    deleteByTeamAndType: (teamId: number, documentType: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM team_documents WHERE team_id = ? AND document_type = ?', [teamId, documentType], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    },

    delete: (id: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM team_documents WHERE id = ?', [id], function(err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      });
    },
    
    update: (id: number, documentPath: string, documentSize: number, documentName?: string, mimeType?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE team_documents SET document_path = ?, file_size = ?, document_name = ?, mime_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [documentPath, documentSize, documentName || '', mimeType || 'application/octet-stream', id],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    },
    
    deleteByTeam: (teamId: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM team_documents WHERE team_id = ?', [teamId], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
    }
  }
};

export default db;
