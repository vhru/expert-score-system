const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'expert_review.db');

console.log('🔍 检查团队文档...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 查找团队"11"的文档
db.all("SELECT * FROM team_documents WHERE team_id = 5", (err, docs) => {
  if (err) {
    console.error('❌ 查询团队文档失败:', err);
    return;
  }
  
  console.log(`\n📄 团队"11"的文档 (team_id=5):`);
  if (docs.length === 0) {
    console.log('  ❌ 没有找到任何文档');
  } else {
    docs.forEach(doc => {
      console.log(`  - ${doc.document_type}: ${doc.file_path}`);
      console.log(`    文件名: ${doc.original_name}`);
      console.log(`    大小: ${doc.file_size} bytes`);
      console.log(`    类型: ${doc.mime_type}`);
      console.log(`    创建时间: ${doc.created_at}`);
      console.log('');
    });
  }
  
  // 检查所有团队文档
  db.all("SELECT td.*, t.team_name FROM team_documents td JOIN teams t ON td.team_id = t.id", (err, allDocs) => {
    if (err) {
      console.error('❌ 查询所有团队文档失败:', err);
      return;
    }
    
    console.log('\n📋 所有团队的文档:');
    if (allDocs.length === 0) {
      console.log('  ❌ 没有找到任何团队文档');
    } else {
      allDocs.forEach(doc => {
        console.log(`  - 团队: ${doc.team_name}, 类型: ${doc.document_type}, 文件: ${doc.original_name}`);
      });
    }
    
    db.close();
  });
});
