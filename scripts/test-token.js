const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_key_here';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzY2MzAyMywiZXhwIjoxNzU3NzQ5NDIzfQ.BpG-KHX8uhsn5e7PSd_e96EjRODlRGTDwdtsIo2Ez0s';

console.log('🔍 验证Token...');

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token验证成功！');
  console.log('解码结果:', decoded);
  console.log('用户角色:', decoded.role);
  console.log('是否管理员:', decoded.role === 'admin');
} catch (error) {
  console.log('❌ Token验证失败:', error.message);
}
