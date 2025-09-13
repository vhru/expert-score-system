const bcrypt = require('bcryptjs');

console.log('🔐 测试密码验证...');

// 测试密码
const testPassword = 'admin123';
const testHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // 示例哈希

console.log('测试密码:', testPassword);
console.log('测试哈希:', testHash);

bcrypt.compare(testPassword, testHash, (err, result) => {
  if (err) {
    console.error('❌ 密码验证失败:', err);
    return;
  }
  
  console.log('密码验证结果:', result);
  
  // 生成新的哈希
  bcrypt.hash(testPassword, 10, (err, hash) => {
    if (err) {
      console.error('❌ 生成哈希失败:', err);
      return;
    }
    
    console.log('新生成的哈希:', hash);
    
    // 验证新哈希
    bcrypt.compare(testPassword, hash, (err, result) => {
      if (err) {
        console.error('❌ 验证新哈希失败:', err);
        return;
      }
      
      console.log('新哈希验证结果:', result);
    });
  });
});
