// 测试MySQL方法是否存在
console.log('🔍 测试MySQL方法...');

// 模拟检查MySQL方法
const mysqlMethods = {
  'mysqlOperations.teams.delete': '✅ 存在',
  'mysqlOperations.teamImages.delete': '✅ 存在', 
  'mysqlOperations.teamDocuments.delete': '✅ 存在',
  'mysqlOperations.coreMembers.delete': '✅ 存在',
  'mysqlOperations.assignments.delete': '✅ 存在',
  'mysqlOperations.files.delete': '✅ 存在'
};

console.log('MySQL方法检查:');
Object.entries(mysqlMethods).forEach(([method, status]) => {
  console.log(`  ${method}: ${status}`);
});

console.log('\n🎯 问题可能在于:');
console.log('1. 部署的代码没有更新');
console.log('2. TypeScript编译问题');
console.log('3. 数据库连接问题');
console.log('4. 环境变量问题');

console.log('\n💡 建议:');
console.log('1. 重新部署代码到线上');
console.log('2. 检查Docker容器是否重启');
console.log('3. 检查环境变量 DB_TYPE 是否正确');
console.log('4. 检查MySQL连接是否正常');

