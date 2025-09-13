const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('👥 创建专家账号...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 创建专家列表
const experts = [
  { username: 'expert1', password: 'password123', personalInfo: '张三 - 计算机科学专家' },
  { username: 'expert2', password: 'password123', personalInfo: '李四 - 软件工程专家' },
  { username: 'expert3', password: 'password123', personalInfo: '王五 - 人工智能专家' },
  { username: 'expert4', password: 'password123', personalInfo: '赵六 - 数据科学专家' },
  { username: 'expert5', password: 'password123', personalInfo: '钱七 - 网络安全专家' },
];

let createdCount = 0;

// 创建专家
function createExpert(expert, callback) {
  bcrypt.hash(expert.password, 10, (err, hash) => {
    if (err) {
      console.error(`❌ 生成密码哈希失败 (${expert.username}):`, err.message);
      callback(err);
      return;
    }

    db.run(
      'INSERT OR IGNORE INTO users (username, password, role, encrypted_info) VALUES (?, ?, ?, ?)',
      [expert.username, hash, 'expert', expert.personalInfo],
      function(err) {
        if (err) {
          console.error(`❌ 创建专家失败 (${expert.username}):`, err.message);
          callback(err);
          return;
        }

        if (this.changes > 0) {
          console.log(`✅ 创建专家: ${expert.username}`);
          createdCount++;
        } else {
          console.log(`⚠️ 专家已存在: ${expert.username}`);
        }
        
        callback(null);
      }
    );
  });
}

// 逐个创建专家
let index = 0;
function createNextExpert() {
  if (index >= experts.length) {
    // 所有专家创建完成
    console.log(`\n🎉 专家创建完成！共创建/更新 ${createdCount} 个专家`);
    
    // 查询所有专家
    db.all("SELECT username, role FROM users WHERE role = 'expert'", (err, users) => {
      if (err) {
        console.error('❌ 查询专家失败:', err.message);
        return;
      }
      
      console.log('\n👥 当前专家列表:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`);
      });
      
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n✅ 现在可以测试评审分配功能了！');
        }
      });
    });
    return;
  }

  createExpert(experts[index], (err) => {
    if (err) {
      console.error('创建专家过程中出错:', err);
      return;
    }
    
    index++;
    createNextExpert();
  });
}

// 开始创建专家
createNextExpert();
