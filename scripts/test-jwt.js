const jwt = require('jsonwebtoken');

// 测试JWT token生成和验证
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

console.log('🔑 JWT测试');
console.log('JWT_SECRET:', JWT_SECRET);

// 生成一个测试token
const testUser = {
  id: 1,
  username: 'admin@example.com',
  role: 'admin'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
console.log('生成的token:', token);

// 验证token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token验证成功:', decoded);
} catch (error) {
  console.log('❌ Token验证失败:', error.message);
}

// 测试无效token
try {
  const invalidToken = 'invalid.token.here';
  const decoded = jwt.verify(invalidToken, JWT_SECRET);
  console.log('❌ 无效token验证成功（不应该发生）:', decoded);
} catch (error) {
  console.log('✅ 无效token验证失败（正确）:', error.message);
}
