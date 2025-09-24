// 简单测试删除方法
console.log('🔍 测试删除方法...');

// 模拟检查方法是否存在
const testMethods = {
  'teams.delete': 'function',
  'teamImages.delete': 'function', 
  'teamDocuments.delete': 'function',
  'coreMembers.delete': 'function',
  'assignments.delete': 'function',
  'files.delete': 'function'
};

console.log('✅ 所有删除方法都应该存在:');
Object.entries(testMethods).forEach(([method, type]) => {
  console.log(`  ${method}: ${type}`);
});

console.log('\n🎯 问题可能在于:');
console.log('1. 部署的代码没有更新');
console.log('2. TypeScript编译问题');
console.log('3. 动态导入问题');
console.log('4. 数据库连接问题');

console.log('\n💡 建议:');
console.log('1. 重新部署代码');
console.log('2. 检查Docker容器是否重启');
console.log('3. 检查数据库连接');

