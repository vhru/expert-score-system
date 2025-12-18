const fs = require('fs');
const path = require('path');

// 测试本地ZIP下载功能
async function testZipDownload() {
  console.log('🔍 测试本地ZIP下载功能...');
  
  // 检查团队数据目录
  const teamDataDir = path.join(process.cwd(), 'uploads', 'team-documents');
  console.log('📁 团队数据目录:', teamDataDir);
  console.log('📁 目录是否存在:', fs.existsSync(teamDataDir));
  
  if (fs.existsSync(teamDataDir)) {
    const files = fs.readdirSync(teamDataDir);
    console.log('📄 找到的文件:', files);
  }
  
  // 检查uploads目录结构
  const uploadsDir = path.join(process.cwd(), 'uploads');
  console.log('\n📁 uploads目录:', uploadsDir);
  console.log('📁 uploads目录是否存在:', fs.existsSync(uploadsDir));
  
  if (fs.existsSync(uploadsDir)) {
    const uploadsFiles = fs.readdirSync(uploadsDir);
    console.log('📄 uploads目录内容:', uploadsFiles);
  }
  
  // 检查是否有团队文件夹
  const teamDataPath = path.join(process.cwd(), 'uploads', 'team_data');
  console.log('\n📁 team_data目录:', teamDataPath);
  console.log('📁 team_data目录是否存在:', fs.existsSync(teamDataPath));
  
  if (fs.existsSync(teamDataPath)) {
    const teamDataFiles = fs.readdirSync(teamDataPath);
    console.log('📄 team_data目录内容:', teamDataFiles);
  }
}

testZipDownload().catch(console.error);
