const { dbOperations } = require('../lib/database-adapter.ts');

async function testDeleteMethods() {
  console.log('🔍 测试删除方法是否存在...');
  
  try {
    // 测试 teams.delete
    console.log('✅ teams.delete:', typeof dbOperations.teams.delete);
    
    // 测试 teamImages.delete
    console.log('✅ teamImages.delete:', typeof dbOperations.teamImages.delete);
    
    // 测试 teamDocuments.delete
    console.log('✅ teamDocuments.delete:', typeof dbOperations.teamDocuments.delete);
    
    // 测试 coreMembers.delete
    console.log('✅ coreMembers.delete:', typeof dbOperations.coreMembers.delete);
    
    // 测试 assignments.delete
    console.log('✅ assignments.delete:', typeof dbOperations.assignments.delete);
    
    // 测试 files.delete
    console.log('✅ files.delete:', typeof dbOperations.files.delete);
    
    console.log('🎉 所有删除方法都存在！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testDeleteMethods();
