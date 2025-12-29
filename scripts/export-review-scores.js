/**
 * 导出评审打分CSV脚本
 * 按项目展示，包含：项目号、项目名、项目负责人、项目负责人单位、平均分
 * 
 * 使用方法：
 * node scripts/export-review-scores.js [output.csv]
 * 
 * 从服务器下载：
 * scp user@host:/path/to/review-scores-xxx.csv ./
 */

const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// 加载环境变量（从 .env.local 或 .env）
// 注意：如果已经在容器内运行，优先使用容器的环境变量（已通过 docker-compose 设置）
// 只有在环境变量未设置时才从文件读取
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  try {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            // 只有在环境变量未设置时才从文件读取（容器环境变量优先）
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
      console.log(`✅ 已加载环境变量文件: ${envFile}`);
      break; // 找到第一个存在的文件就停止
    }
  } catch (error) {
    // 忽略环境变量加载错误
  }
}

// 加密密钥（与 lib/encryption.ts 保持一致）
const SECRET_KEY = 'your_aes_secret_key_32_chars_long';

// 解密函数
function decryptData(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}

// 检测数据库类型并获取连接
async function getDatabaseConnection() {
  // 使用和应用相同的默认值（参考 lib/database-adapter.ts）
  // 注意：如果在 Docker 容器内运行，DB_HOST 应该是 'mysql'（服务名）
  // 如果在主机上运行，应该使用 'localhost'（通过端口映射）
  let dbHost = process.env.DB_HOST;
  if (!dbHost) {
    // 如果未设置，检查是否在 Docker 容器内（通过检查 /proc/1/cgroup）
    try {
      const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroup.includes('docker')) {
        dbHost = 'mysql'; // 在容器内，使用服务名
      } else {
        dbHost = 'localhost'; // 在主机上，使用 localhost
      }
    } catch {
      dbHost = 'localhost'; // 默认使用 localhost
    }
  }
  
  // 在容器内，如果环境变量未设置，使用 Docker Compose 的默认值
  const dbUser = process.env.DB_USER || 'expert_user';
  const dbPassword = process.env.DB_PASSWORD || 'expert_password';
  const dbName = process.env.DB_NAME || 'expert_review';
  const dbPort = parseInt(process.env.DB_PORT || '3306');
  
  // 调试信息
  console.log('🔍 数据库连接配置:');
  console.log(`   DB_HOST=${dbHost}`);
  console.log(`   DB_USER=${dbUser}`);
  console.log(`   DB_PASSWORD=${dbPassword ? '***' : '(空)'}`);
  console.log(`   DB_NAME=${dbName}`);
  console.log(`   DB_PORT=${dbPort}`);
  console.log('');

  // 直接尝试使用 MySQL（生产环境默认使用 MySQL，本机 MySQL 使用默认值即可）
  try {
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });
    
    // 测试连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    return { type: 'mysql', pool };
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error.message);
    console.error('💡 当前配置:');
    console.error(`   DB_HOST=${dbHost}`);
    console.error(`   DB_USER=${dbUser}`);
    console.error(`   DB_PASSWORD=${dbPassword ? '***' : '(空)'}`);
    console.error(`   DB_NAME=${dbName}`);
    console.error(`   DB_PORT=${dbPort}`);
    console.error('');
    console.error('💡 如果配置不正确，请在 .env.local 或 .env 文件中设置，或在命令行中传入环境变量');
    throw new Error('数据库连接失败：请检查 MySQL 配置');
  }
}

// MySQL 查询
async function queryMySQL(pool) {
  const [rows] = await pool.execute(`
    SELECT 
      t.id as team_id,
      t.team_name,
      t.encrypted_info,
      COALESCE(SUM(CASE WHEN ra.assignment_status = 'completed' AND ra.score IS NOT NULL THEN ra.score ELSE 0 END), 0) as total_score,
      COUNT(CASE WHEN ra.assignment_status = 'completed' AND ra.score IS NOT NULL THEN 1 END) as review_count
    FROM teams t
    LEFT JOIN team_documents td ON td.team_id = t.id
    LEFT JOIN files f ON f.file_path = td.document_path
    LEFT JOIN review_assignments ra ON ra.file_id = f.id
    WHERE t.status = 'active' AND t.audit_status = 'approved'
    GROUP BY t.id, t.team_name, t.encrypted_info
    ORDER BY t.id
  `);
  return rows;
}

// SQLite 查询
function querySQLite(db) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        t.id as team_id,
        t.team_name,
        t.encrypted_info,
        COALESCE(SUM(CASE WHEN ra.assignment_status = 'completed' AND ra.score IS NOT NULL THEN ra.score ELSE 0 END), 0) as total_score,
        COUNT(CASE WHEN ra.assignment_status = 'completed' AND ra.score IS NOT NULL THEN 1 END) as review_count
      FROM teams t
      LEFT JOIN team_documents td ON td.team_id = t.id
      LEFT JOIN files f ON f.file_path = td.document_path
      LEFT JOIN review_assignments ra ON ra.file_id = f.id
      WHERE t.status = 'active' AND t.audit_status = 'approved'
      GROUP BY t.id, t.team_name, t.encrypted_info
      ORDER BY t.id
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// CSV 转义
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 生成 CSV
function generateCSV(data) {
  const headers = ['项目号', '项目名', '项目负责人', '项目负责人单位', '平均分'];
  const rows = [headers.map(escapeCSV).join(',')];

  for (const item of data) {
    const row = [
      item.team_id,
      item.team_name || '',
      item.contact_person_name || '',
      item.contact_person_unit || '',
      item.average_score !== null ? item.average_score.toFixed(2) : ''
    ];
    rows.push(row.map(escapeCSV).join(','));
  }

  // 添加 BOM 以支持 Excel 中文显示
  return '\uFEFF' + rows.join('\n');
}

// 主函数
async function main() {
  try {
    console.log('📊 开始导出评审打分数据...\n');

    // 获取数据库连接
    const dbConn = await getDatabaseConnection();
    console.log(`✅ 数据库类型: ${dbConn.type.toUpperCase()}\n`);

    // 查询数据
    let rawData;
    if (dbConn.type === 'mysql') {
      rawData = await queryMySQL(dbConn.pool);
      await dbConn.pool.end();
    } else {
      rawData = await querySQLite(dbConn.db);
      dbConn.db.close();
    }

    console.log(`📋 查询到 ${rawData.length} 个项目\n`);

    // 处理数据：解密并计算平均分
    const processedData = rawData.map(item => {
      let contactPersonName = '';
      let contactPersonUnit = '';

      // 解密 encrypted_info
      if (item.encrypted_info) {
        try {
          const decryptedInfo = JSON.parse(decryptData(item.encrypted_info));
          contactPersonName = decryptedInfo.contactInfo?.contactPersonName || '';
          contactPersonUnit = decryptedInfo.contactInfo?.contactPersonUnit || '';
          
          // 调试：如果负责人单位为空，检查数据结构
          if (!contactPersonUnit && contactPersonName) {
            // 尝试其他可能的字段名
            contactPersonUnit = decryptedInfo.contactInfo?.organization || 
                               decryptedInfo.contactInfo?.unit || 
                               decryptedInfo.contactInfo?.contactPersonOrganization || '';
            
            // 调试输出：显示前3个项目的解密数据结构（仅当单位为空时）
            if (item.team_id <= 3 && !contactPersonUnit) {
              console.log(`\n🔍 调试：项目 ${item.team_id} (${item.team_name}) 的 contactInfo 结构:`);
              console.log(JSON.stringify(decryptedInfo.contactInfo, null, 2));
            }
          }
        } catch (error) {
          console.warn(`⚠️  项目 ${item.team_id} (${item.team_name}) 解密失败:`, error.message);
        }
      }

      // 计算平均分
      const reviewCount = item.review_count || 0;
      const totalScore = item.total_score || 0;
      const averageScore = reviewCount > 0 ? totalScore / reviewCount : null;

      return {
        team_id: item.team_id,
        team_name: item.team_name || '',
        contact_person_name: contactPersonName,
        contact_person_unit: contactPersonUnit,
        average_score: averageScore,
        review_count: reviewCount
      };
    });

    // 生成 CSV
    const csvContent = generateCSV(processedData);

    // 输出文件
    const outputFile = process.argv[2] || path.join(__dirname, '..', `review-scores-${Date.now()}.csv`);
    fs.writeFileSync(outputFile, csvContent, 'utf8');

    console.log(`✅ CSV 文件已生成: ${outputFile}\n`);
    console.log(`📊 统计信息:`);
    console.log(`   - 总项目数: ${processedData.length}`);
    console.log(`   - 有评审记录的项目: ${processedData.filter(p => p.review_count > 0).length}`);
    console.log(`   - 有平均分的项目: ${processedData.filter(p => p.average_score !== null).length}\n`);

  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { main };

