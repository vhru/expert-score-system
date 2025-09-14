// 数据库适配器 - 根据环境自动选择MySQL或SQLite
import { dbOperations as sqliteOperations } from './simple-sqlite';

// MySQL数据库操作（基于现有的database.ts）
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'expert_review',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let mysqlPool: mysql.Pool | null = null;

// 获取MySQL连接池
function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool(dbConfig);
  }
  return mysqlPool;
}

// 判断是否使用MySQL
function useMySQL(): boolean {
  // 生产环境默认使用MySQL，除非明确设置为SQLite
  if (process.env.NODE_ENV === 'production') {
    return process.env.DB_TYPE !== 'sqlite';
  }
  
  // 开发环境：如果设置了MySQL配置则使用MySQL，否则使用SQLite
  return !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD);
}

// 启动时打印数据库类型信息
function logDatabaseInfo() {
  const dbType = useMySQL() ? 'MySQL' : 'SQLite';
  const env = process.env.NODE_ENV || 'development';
  
  console.log('='.repeat(50));
  console.log('🗄️  数据库配置信息');
  console.log('='.repeat(50));
  console.log(`环境: ${env}`);
  console.log(`数据库类型: ${dbType}`);
  
  if (useMySQL()) {
    console.log(`MySQL主机: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`MySQL端口: ${process.env.DB_PORT || '3306'}`);
    console.log(`数据库名: ${process.env.DB_NAME || 'expert_review'}`);
    console.log(`用户名: ${process.env.DB_USER || 'root'}`);
  } else {
    console.log(`SQLite文件: expert_review.db`);
  }
  console.log('='.repeat(50));
}

// 在模块加载时打印信息
logDatabaseInfo();

// MySQL数据库操作
const mysqlOperations = {
  // 用户操作
  users: {
    async findByUsername(username: string) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      return Array.isArray(rows) ? rows[0] : null;
    },
    
    async create(username: string, password: string, role: string, encryptedInfo?: string, expertType?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO users (username, password, role, encrypted_info, expert_type) VALUES (?, ?, ?, ?, ?)',
        [username, password, role, encryptedInfo, expertType || 'team']
      );
      return result;
    },
    
    async findAll() {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return rows;
    },
    
    async update(id: number, updateData: any) {
      const pool = getMysqlPool();
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
      if (updateData.expert_type) {
        fields.push('expert_type = ?');
        values.push(updateData.expert_type);
      }
      
      if (fields.length === 0) {
        return { changes: 0 };
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const [result] = await pool.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result;
    },
    
    async delete(id: number) {
      const pool = getMysqlPool();
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result;
    }
  },
  
  // 团队操作
  teams: {
    async create(teamName: string, password: string, contactEmail: string, encryptedInfo?: string, isEnterprise?: boolean, enterpriseName?: string, enterpriseLicense?: string, projectStage?: string, projectStageOthers?: string, nationalityType?: string, selectedCountries?: string, nationalityOthers?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO teams (team_name, password, contact_email, encrypted_info, is_enterprise, enterprise_name, enterprise_license, project_stage, project_stage_others, nationality_type, selected_countries, nationality_others, audit_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [teamName, password, contactEmail, encryptedInfo, isEnterprise || false, enterpriseName || '', enterpriseLicense || '', projectStage || '', projectStageOthers || '', nationalityType || 'single', selectedCountries || '', nationalityOthers || '', 'pending']
      );
      return result;
    },
    
    async findByName(teamName: string) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM teams WHERE team_name = ?', [teamName]);
      return Array.isArray(rows) ? rows[0] : null;
    },
    
    async findByEmail(email: string) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM teams WHERE contact_email = ?', [email]);
      return Array.isArray(rows) ? rows[0] : null;
    },
    
    async findById(id: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM teams WHERE id = ?', [id]);
      return Array.isArray(rows) ? rows[0] : null;
    },
    
    async findAll() {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM teams ORDER BY created_at DESC');
      return rows;
    },
    
    async updatePassword(id: number, password: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'UPDATE teams SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [password, id]
      );
      return result;
    },
    
    async updateAuditStatus(id: number, status: string, notes: string, auditedBy: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'UPDATE teams SET audit_status = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP, audited_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, notes, auditedBy, id]
      );
      return result;
    }
  },
  
  // 文件操作
  files: {
    async create(originalName: string, filePath: string, fileSize: number, mimeType: string, encryptedInfo?: string, teamName?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO files (original_name, file_path, file_size, mime_type, encrypted_info, team_name) VALUES (?, ?, ?, ?, ?, ?)',
        [originalName, filePath, fileSize, mimeType, encryptedInfo, teamName]
      );
      return result;
    },
    
    async findById(id: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
      return Array.isArray(rows) ? rows[0] : null;
    },
    
    async findAll() {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM files ORDER BY created_at DESC');
      return rows;
    },
    
    async updateStatus(id: number, status: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'UPDATE files SET upload_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      return result;
    }
  },
  
  // 评审分配操作
  assignments: {
    async create(fileId: number, expertId: number) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO review_assignments (file_id, expert_id, status) VALUES (?, ?, ?)',
        [fileId, expertId, 'assigned']
      );
      return result;
    },
    
    async findByExpert(expertId: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute(
        'SELECT ra.*, f.original_name, f.file_path FROM review_assignments ra JOIN files f ON ra.file_id = f.id WHERE ra.expert_id = ?',
        [expertId]
      );
      return rows;
    },
    
    async findByFile(fileId: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute(
        'SELECT ra.*, u.username as expert_name FROM review_assignments ra JOIN users u ON ra.expert_id = u.id WHERE ra.file_id = ?',
        [fileId]
      );
      return rows;
    },
    
    async updateStatus(id: number, status: string, score?: number, comments?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'UPDATE review_assignments SET status = ?, score = ?, comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, score || null, comments || null, id]
      );
      return result;
    },
    
    async getStatistics() {
      const pool = getMysqlPool();
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_assignments,
          SUM(CASE WHEN assignment_status = 'assigned' THEN 1 ELSE 0 END) as pending_reviews,
          SUM(CASE WHEN assignment_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_reviews,
          SUM(CASE WHEN assignment_status = 'completed' THEN 1 ELSE 0 END) as completed_reviews,
          AVG(CASE WHEN assignment_status = 'completed' THEN score ELSE NULL END) as average_score
        FROM review_assignments
      `);
      return rows[0];
    }
  },
  
  // 团队图片操作
  teamImages: {
    async create(teamId: number, imageName: string, imagePath: string, imageSize: number) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO team_images (team_id, image_name, image_path, image_size) VALUES (?, ?, ?, ?)',
        [teamId, imageName, imagePath, imageSize]
      );
      return result;
    },
    
    async findByTeam(teamId: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM team_images WHERE team_id = ?', [teamId]);
      return rows;
    }
  },
  
  // 核心成员操作
  coreMembers: {
    async create(teamId: number, name: string, position: string, nationality: string, idType: string, idNumber: string, cvPath?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO core_members (team_id, name, position, nationality, id_type, id_number, cv_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [teamId, name, position, nationality, idType, idNumber, cvPath || null]
      );
      return result;
    },
    
    async findByTeam(teamId: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM core_members WHERE team_id = ?', [teamId]);
      return rows;
    }
  },
  
  // 团队文档操作
  teamDocuments: {
    async create(teamId: number, documentType: string, documentPath: string, documentSize: number, documentName?: string, mimeType?: string) {
      const pool = getMysqlPool();
      const [result] = await pool.execute(
        'INSERT INTO team_documents (team_id, document_type, document_path, document_size, document_name, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
        [teamId, documentType, documentPath, documentSize, documentName || '', mimeType || 'application/octet-stream']
      );
      return result;
    },
    
    async findByTeam(teamId: number) {
      const pool = getMysqlPool();
      const [rows] = await pool.execute('SELECT * FROM team_documents WHERE team_id = ?', [teamId]);
      return rows;
    }
  }
};

// 获取表数量的方法
async function getTableCount() {
  if (useMySQL()) {
    const pool = getMysqlPool();
    const [rows] = await pool.execute('SHOW TABLES');
    return Array.isArray(rows) ? rows.length : 0;
  } else {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('expert_review.db');
    
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err: any, rows: any[]) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows ? rows.length : 0);
        }
      });
    });
  }
}

// 数据库适配器 - 根据环境自动选择
export const dbOperations = {
  users: {
    async findByUsername(username: string) {
      if (useMySQL()) {
        return await mysqlOperations.users.findByUsername(username);
      } else {
        return sqliteOperations.users.findByUsername(username);
      }
    },
    
    async create(username: string, password: string, role: string, encryptedInfo?: string, expertType?: string) {
      if (useMySQL()) {
        return await mysqlOperations.users.create(username, password, role, encryptedInfo, expertType);
      } else {
        return sqliteOperations.users.create(username, password, role, encryptedInfo, expertType);
      }
    },
    
    async findAll() {
      if (useMySQL()) {
        return await mysqlOperations.users.findAll();
      } else {
        return sqliteOperations.users.findAll();
      }
    },
    
    async update(id: number, updateData: any) {
      if (useMySQL()) {
        return await mysqlOperations.users.update(id, updateData);
      } else {
        return sqliteOperations.users.update(id, updateData);
      }
    },
    
    async delete(id: number) {
      if (useMySQL()) {
        return await mysqlOperations.users.delete(id);
      } else {
        return sqliteOperations.users.delete(id);
      }
    }
  },
  
  teams: {
    async create(teamName: string, password: string, contactEmail: string, encryptedInfo?: string, isEnterprise?: boolean, enterpriseName?: string, enterpriseLicense?: string, projectStage?: string, projectStageOthers?: string, nationalityType?: string, selectedCountries?: string, nationalityOthers?: string) {
      if (useMySQL()) {
        return await mysqlOperations.teams.create(teamName, password, contactEmail, encryptedInfo, isEnterprise, enterpriseName, enterpriseLicense, projectStage, projectStageOthers, nationalityType, selectedCountries, nationalityOthers);
      } else {
        return sqliteOperations.teams.create(teamName, password, contactEmail, encryptedInfo, isEnterprise, enterpriseName, enterpriseLicense, projectStage, projectStageOthers, nationalityType, selectedCountries, nationalityOthers);
      }
    },
    
    async findByName(teamName: string) {
      if (useMySQL()) {
        return await mysqlOperations.teams.findByName(teamName);
      } else {
        return sqliteOperations.teams.findByName(teamName);
      }
    },
    
    async findByEmail(email: string) {
      if (useMySQL()) {
        return await mysqlOperations.teams.findByEmail(email);
      } else {
        return sqliteOperations.teams.findByEmail(email);
      }
    },
    
    async findById(id: number) {
      if (useMySQL()) {
        return await mysqlOperations.teams.findById(id);
      } else {
        return sqliteOperations.teams.findById(id);
      }
    },
    
    async findAll() {
      if (useMySQL()) {
        return await mysqlOperations.teams.findAll();
      } else {
        return sqliteOperations.teams.findAll();
      }
    },
    
    async updatePassword(id: number, password: string) {
      if (useMySQL()) {
        return await mysqlOperations.teams.updatePassword(id, password);
      } else {
        return sqliteOperations.teams.updatePassword(id, password);
      }
    },
    
    async updateAuditStatus(id: number, status: string, notes: string, auditedBy: string) {
      if (useMySQL()) {
        return await mysqlOperations.teams.updateAuditStatus(id, status, notes, auditedBy);
      } else {
        return sqliteOperations.teams.updateAuditStatus(id, status, notes, auditedBy);
      }
    }
  },
  
  files: {
    async create(originalName: string, filePath: string, fileSize: number, mimeType: string, encryptedInfo?: string, teamName?: string) {
      if (useMySQL()) {
        return await mysqlOperations.files.create(originalName, filePath, fileSize, mimeType, encryptedInfo, teamName);
      } else {
        return sqliteOperations.files.create(originalName, filePath, fileSize, mimeType, encryptedInfo, teamName);
      }
    },
    
    async findById(id: number) {
      if (useMySQL()) {
        return await mysqlOperations.files.findById(id);
      } else {
        return sqliteOperations.files.findById(id);
      }
    },
    
    async findAll() {
      if (useMySQL()) {
        return await mysqlOperations.files.findAll();
      } else {
        return sqliteOperations.files.findAll();
      }
    },
    
    async updateStatus(id: number, status: string) {
      if (useMySQL()) {
        return await mysqlOperations.files.updateStatus(id, status);
      } else {
        return sqliteOperations.files.updateStatus(id, status);
      }
    }
  },
  
  assignments: {
    async create(fileId: number, expertId: number) {
      if (useMySQL()) {
        return await mysqlOperations.assignments.create(fileId, expertId);
      } else {
        return sqliteOperations.assignments.create(fileId, expertId);
      }
    },
    
    async findByExpert(expertId: number) {
      if (useMySQL()) {
        return await mysqlOperations.assignments.findByExpert(expertId);
      } else {
        return sqliteOperations.assignments.findByExpert(expertId);
      }
    },
    
    async findByFile(fileId: number) {
      if (useMySQL()) {
        return await mysqlOperations.assignments.findByFile(fileId);
      } else {
        return sqliteOperations.assignments.findByFile(fileId);
      }
    },
    
    async updateStatus(id: number, status: string, score?: number, comments?: string) {
      if (useMySQL()) {
        return await mysqlOperations.assignments.updateStatus(id, status, score, comments);
      } else {
        return sqliteOperations.assignments.updateStatus(id, status, score, comments);
      }
    },
    
    async getStatistics() {
      if (useMySQL()) {
        return await mysqlOperations.assignments.getStatistics();
      } else {
        return sqliteOperations.assignments.getStatistics();
      }
    }
  },
  
  teamImages: {
    async create(teamId: number, imageName: string, imagePath: string, imageSize: number) {
      if (useMySQL()) {
        return await mysqlOperations.teamImages.create(teamId, imageName, imagePath, imageSize);
      } else {
        return sqliteOperations.teamImages.create(teamId, imageName, imagePath, imageSize);
      }
    },
    
    async findByTeam(teamId: number) {
      if (useMySQL()) {
        return await mysqlOperations.teamImages.findByTeam(teamId);
      } else {
        return sqliteOperations.teamImages.findByTeam(teamId);
      }
    }
  },
  
  coreMembers: {
    async create(teamId: number, name: string, position: string, nationality: string, idType: string, idNumber: string, cvPath?: string) {
      if (useMySQL()) {
        return await mysqlOperations.coreMembers.create(teamId, name, position, nationality, idType, idNumber, cvPath);
      } else {
        return sqliteOperations.coreMembers.create(teamId, name, position, nationality, idType, idNumber, cvPath);
      }
    },
    
    async findByTeam(teamId: number) {
      if (useMySQL()) {
        return await mysqlOperations.coreMembers.findByTeam(teamId);
      } else {
        return sqliteOperations.coreMembers.findByTeam(teamId);
      }
    }
  },
  
  teamDocuments: {
    async create(teamId: number, documentType: string, documentPath: string, documentSize: number, documentName?: string, mimeType?: string) {
      if (useMySQL()) {
        return await mysqlOperations.teamDocuments.create(teamId, documentType, documentPath, documentSize, documentName, mimeType);
      } else {
        return sqliteOperations.teamDocuments.create(teamId, documentType, documentPath, documentSize, documentName, mimeType);
      }
    },
    
    async findByTeam(teamId: number) {
      if (useMySQL()) {
        return await mysqlOperations.teamDocuments.findByTeam(teamId);
      } else {
        return sqliteOperations.teamDocuments.findByTeam(teamId);
      }
    }
  },
  
  // 系统信息方法
  async getTableCount() {
    return await getTableCount();
  }
};

// 初始化数据库函数
export async function initDatabase() {
  if (useMySQL()) {
    // MySQL初始化逻辑
    const pool = getMysqlPool();
    
    // 创建表结构
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'expert') NOT NULL DEFAULT 'expert',
        encrypted_info TEXT,
        expert_type VARCHAR(20) DEFAULT 'team',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 确保expert_type字段存在（兼容现有数据库）
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN expert_type VARCHAR(20) DEFAULT 'team'`);
    } catch (error) {
      // 如果字段已存在，忽略错误
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add expert_type column:', error.message);
      }
    }
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        contact_email VARCHAR(100) NOT NULL,
        encrypted_info TEXT,
        is_enterprise BOOLEAN DEFAULT FALSE,
        enterprise_name VARCHAR(200),
        enterprise_license VARCHAR(500),
        project_stage VARCHAR(100),
        project_stage_others TEXT,
        nationality_type ENUM('single', 'multiple') DEFAULT 'single',
        selected_countries TEXT,
        nationality_others TEXT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        audit_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        audit_notes TEXT,
        audited_at TIMESTAMP NULL,
        audited_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 确保audit相关字段存在（兼容现有数据库）
    try {
      await pool.execute(`ALTER TABLE teams ADD COLUMN audit_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add audit_status column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE teams ADD COLUMN audit_notes TEXT`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add audit_notes column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE teams ADD COLUMN audited_at TIMESTAMP NULL`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add audited_at column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE teams ADD COLUMN audited_by VARCHAR(100)`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add audited_by column:', error.message);
      }
    }
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        encrypted_info TEXT,
        upload_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        team_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS review_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        expert_id INT NOT NULL,
        status ENUM('assigned', 'in_progress', 'completed') DEFAULT 'assigned',
        score DECIMAL(5,2),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (expert_id) REFERENCES users(id)
      )
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS team_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        image_name VARCHAR(255) NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        image_size INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS core_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(100),
        nationality VARCHAR(50),
        id_type VARCHAR(20),
        id_number VARCHAR(50),
        cv_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS team_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);
    
    // 确保team_documents表的字段存在（兼容现有数据库）
    try {
      await pool.execute(`ALTER TABLE team_documents ADD COLUMN document_name VARCHAR(255) NOT NULL DEFAULT ''`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add document_name column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE team_documents ADD COLUMN file_size INT NOT NULL DEFAULT 0`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add file_size column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE team_documents ADD COLUMN mime_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream'`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add mime_type column:', error.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE team_documents ADD COLUMN uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Warning: Could not add uploaded_at column:', error.message);
      }
    }
    
    // 创建管理员用户
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    await pool.execute(`
      INSERT IGNORE INTO users (username, password, role, expert_type) 
      VALUES (?, ?, 'admin', 'admin')
    `, [process.env.ADMIN_EMAIL || 'admin@example.com', adminPassword]);
    
    console.log('MySQL database initialized successfully');
  } else {
    // SQLite初始化逻辑
    const { initDatabase: initSQLite } = await import('./simple-sqlite');
    await initSQLite();
  }
}

// 获取当前使用的数据库类型
export function getDatabaseType(): string {
  return useMySQL() ? 'MySQL' : 'SQLite';
}
