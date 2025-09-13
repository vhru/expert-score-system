const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查文件状态和评审状态...');

// 检查文件状态
db.all("SELECT id, original_name, team_name, upload_status FROM files", (err, files) => {
  if (err) {
    console.error('Error fetching files:', err);
    return;
  }
  
  console.log('\n📁 文件状态:');
  files.forEach(file => {
    console.log(`  ${file.id}: ${file.team_name || file.original_name} - ${file.upload_status}`);
  });
  
  // 检查评审分配状态
  db.all(`
    SELECT ra.*, f.team_name, f.original_name, u.username as expert_name
    FROM review_assignments ra
    JOIN files f ON ra.file_id = f.id
    JOIN users u ON ra.expert_id = u.id
    ORDER BY ra.file_id, ra.expert_id
  `, (err, assignments) => {
    if (err) {
      console.error('Error fetching assignments:', err);
      return;
    }
    
    console.log('\n📝 评审分配状态:');
    assignments.forEach(assignment => {
      console.log(`  文件: ${assignment.team_name || assignment.original_name}`);
      console.log(`    专家: ${assignment.expert_name} - ${assignment.assignment_status}`);
      console.log(`    分数: ${assignment.score || '未评分'}`);
      console.log('');
    });
    
    // 检查状态一致性
    console.log('\n🔍 状态一致性检查:');
    files.forEach(file => {
      const fileAssignments = assignments.filter(a => a.file_id === file.id);
      const completedAssignments = fileAssignments.filter(a => a.assignment_status === 'completed');
      
      console.log(`\n📁 ${file.team_name || file.original_name}:`);
      console.log(`  文件状态: ${file.upload_status}`);
      console.log(`  评审分配: ${fileAssignments.length} 个专家`);
      console.log(`  已完成: ${completedAssignments.length} 个`);
      console.log(`  进度: ${completedAssignments.length}/${fileAssignments.length}`);
      
      if (fileAssignments.length > 0 && completedAssignments.length === fileAssignments.length) {
        console.log(`  ✅ 所有专家都已完成评审`);
      } else if (fileAssignments.length > 0) {
        console.log(`  ⚠️ 还有专家未完成评审`);
      } else {
        console.log(`  ❌ 未分配专家`);
      }
    });
    
    db.close();
  });
});
