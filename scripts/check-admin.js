const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查管理员账号状态...');

db.all('SELECT * FROM users WHERE role = "admin"', (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
  } else {
    console.log('管理员账号:', rows);
  }
  db.close();
});