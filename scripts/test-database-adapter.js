// 测试数据库适配器
const path = require('path');

// 模拟环境变量
process.env.NODE_ENV = 'test';

// 测试SQLite模式（默认）
console.log('=== 测试SQLite模式 ===');
delete process.env.DB_HOST;
delete process.env.DB_USER;
delete process.env.DB_PASSWORD;

// 动态导入数据库适配器
async function testDatabaseAdapter() {
  try {
    const { getDatabaseType, initDatabase } = await import('../lib/database-adapter.ts');
    
    console.log('当前数据库类型:', getDatabaseType());
    
    // 测试初始化
    console.log('测试数据库初始化...');
    await initDatabase();
    console.log('✅ 数据库初始化成功');
    
    // 测试MySQL模式
    console.log('\n=== 测试MySQL模式 ===');
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'test';
    
    console.log('当前数据库类型:', getDatabaseType());
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDatabaseAdapter();
