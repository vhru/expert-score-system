const http = require('http');

// 高并发测试配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  concurrentUsers: 200, // 模拟200个并发用户
  burstRequests: 50, // 突发请求数
  testDuration: 60000, // 测试持续60秒
};

const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
  peakConcurrency: 0,
  currentConcurrency: 0,
};

// 发送单个请求
function sendRequest(path = '/portal') {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    stats.currentConcurrency++;
    stats.peakConcurrency = Math.max(stats.peakConcurrency, stats.currentConcurrency);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'ConcurrentTest/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        stats.currentConcurrency--;
        stats.totalRequests++;
        stats.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.successfulRequests++;
        } else {
          stats.failedRequests++;
          stats.errors.push({
            statusCode: res.statusCode,
            path,
            responseTime,
            timestamp: new Date().toISOString(),
          });
        }
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          dataLength: data.length,
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      stats.currentConcurrency--;
      stats.totalRequests++;
      stats.failedRequests++;
      stats.responseTimes.push(responseTime);
      stats.errors.push({
        error: error.message,
        path,
        responseTime,
        timestamp: new Date().toISOString(),
      });
      
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      stats.currentConcurrency--;
      stats.totalRequests++;
      stats.failedRequests++;
      stats.responseTimes.push(responseTime);
      stats.errors.push({
        error: 'Request timeout',
        path,
        responseTime,
        timestamp: new Date().toISOString(),
      });
      
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 模拟用户行为
async function simulateUser(userId) {
  const paths = [
    '/portal',
    '/team-register-new',
    '/enterprise-register',
    '/team-login',
    '/expert-login',
  ];
  
  const requests = Math.floor(Math.random() * 5) + 3; // 每个用户3-7个请求
  
  for (let i = 0; i < requests; i++) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    try {
      await sendRequest(path);
      
      // 用户行为间隔
      const delay = Math.random() * 2000 + 500; // 0.5-2.5秒
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`用户 ${userId} 请求失败: ${error.message}`);
    }
  }
}

// 突发流量测试
async function burstTest() {
  console.log('🚀 开始突发流量测试...');
  
  const promises = [];
  for (let i = 0; i < CONFIG.burstRequests; i++) {
    promises.push(sendRequest('/portal'));
  }
  
  try {
    const results = await Promise.all(promises);
    console.log(`✅ 突发测试完成: ${results.length} 个请求`);
  } catch (error) {
    console.error('❌ 突发测试失败:', error.message);
  }
}

// 持续负载测试
async function sustainedLoadTest() {
  console.log('🔄 开始持续负载测试...');
  
  const startTime = Date.now();
  const endTime = startTime + CONFIG.testDuration;
  
  // 持续发送请求
  const interval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(interval);
      return;
    }
    
    // 随机选择路径
    const paths = ['/portal', '/team-register-new', '/enterprise-register'];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    sendRequest(path).catch(error => {
      console.error('持续测试请求失败:', error.message);
    });
  }, 100); // 每100ms发送一个请求
  
  // 等待测试完成
  await new Promise(resolve => setTimeout(resolve, CONFIG.testDuration));
  clearInterval(interval);
}

// 并发用户测试
async function concurrentUserTest() {
  console.log('👥 开始并发用户测试...');
  
  const promises = [];
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    promises.push(simulateUser(i + 1));
  }
  
  try {
    await Promise.all(promises);
    console.log(`✅ 并发用户测试完成: ${CONFIG.concurrentUsers} 个用户`);
  } catch (error) {
    console.error('❌ 并发用户测试失败:', error.message);
  }
}

// 计算统计信息
function calculateStats() {
  const responseTimes = stats.responseTimes.sort((a, b) => a - b);
  const totalTime = Date.now() - stats.startTime;
  
  return {
    totalRequests: stats.totalRequests,
    successfulRequests: stats.successfulRequests,
    failedRequests: stats.failedRequests,
    successRate: (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) + '%',
    totalTime: totalTime + 'ms',
    requestsPerSecond: (stats.totalRequests / (totalTime / 1000)).toFixed(2),
    peakConcurrency: stats.peakConcurrency,
    currentConcurrency: stats.currentConcurrency,
    
    responseTime: {
      min: Math.min(...responseTimes) + 'ms',
      max: Math.max(...responseTimes) + 'ms',
      avg: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)] + 'ms',
      p90: responseTimes[Math.floor(responseTimes.length * 0.9)] + 'ms',
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)] + 'ms',
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)] + 'ms',
    },
    
    errors: stats.errors.slice(0, 20), // 显示前20个错误
  };
}

// 主测试函数
async function runConcurrentTest() {
  console.log('🎯 高并发负载测试开始');
  console.log(`📊 测试配置:`);
  console.log(`   - 并发用户: ${CONFIG.concurrentUsers}`);
  console.log(`   - 突发请求: ${CONFIG.burstRequests}`);
  console.log(`   - 测试时长: ${CONFIG.testDuration / 1000}秒`);
  console.log('─'.repeat(60));
  
  // 1. 突发流量测试
  await burstTest();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. 持续负载测试
  await sustainedLoadTest();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. 并发用户测试
  await concurrentUserTest();
  
  // 等待所有请求完成
  console.log('⏳ 等待所有请求完成...');
  while (stats.currentConcurrency > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📈 高并发测试结果');
  console.log('='.repeat(60));
  
  const results = calculateStats();
  
  console.log(`📊 总请求数: ${results.totalRequests}`);
  console.log(`✅ 成功请求: ${results.successfulRequests}`);
  console.log(`❌ 失败请求: ${results.failedRequests}`);
  console.log(`📈 成功率: ${results.successRate}`);
  console.log(`⏱️  总耗时: ${results.totalTime}`);
  console.log(`🚀 请求/秒: ${results.requestsPerSecond}`);
  console.log(`👥 峰值并发: ${results.peakConcurrency}`);
  
  console.log('\n📊 响应时间统计:');
  console.log(`   最小: ${results.responseTime.min}`);
  console.log(`   最大: ${results.responseTime.max}`);
  console.log(`   平均: ${results.responseTime.avg}`);
  console.log(`   P50:  ${results.responseTime.p50}`);
  console.log(`   P90:  ${results.responseTime.p90}`);
  console.log(`   P95:  ${results.responseTime.p95}`);
  console.log(`   P99:  ${results.responseTime.p99}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 错误详情 (前20个):');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.path}: ${error.error || error.statusCode} (${error.responseTime}ms)`);
    });
  }
  
  // 性能评估
  console.log('\n🎯 性能评估:');
  const avgResponseTime = parseFloat(results.responseTime.avg);
  const successRate = parseFloat(results.successRate);
  const p95ResponseTime = parseFloat(results.responseTime.p95);
  
  if (avgResponseTime < 500 && successRate > 95 && p95ResponseTime < 1000) {
    console.log('🟢 优秀: 系统在高并发下表现良好');
  } else if (avgResponseTime < 1000 && successRate > 90 && p95ResponseTime < 2000) {
    console.log('🟡 良好: 系统可以处理中等并发');
  } else if (avgResponseTime < 2000 && successRate > 80 && p95ResponseTime < 5000) {
    console.log('🟠 一般: 系统需要优化以处理高并发');
  } else {
    console.log('🔴 较差: 系统无法处理高并发，需要重大优化');
  }
  
  // 瓶颈分析
  console.log('\n🔍 瓶颈分析:');
  
  if (avgResponseTime > 1000) {
    console.log('⚠️  响应时间慢，主要瓶颈:');
    console.log('   🔴 SQLite 数据库: 单线程写入，并发限制严重');
    console.log('   🟡 文件 I/O: 同步文件操作阻塞');
    console.log('   🟡 加密操作: CPU 密集型计算');
  }
  
  if (successRate < 90) {
    console.log('⚠️  成功率低，系统问题:');
    console.log('   🔴 数据库连接: SQLite 文件锁冲突');
    console.log('   🟡 内存不足: Node.js 内存泄漏');
    console.log('   🟡 服务器资源: CPU/内存/磁盘限制');
  }
  
  if (results.peakConcurrency > 100) {
    console.log('⚠️  高并发问题:');
    console.log('   🔴 数据库瓶颈: SQLite 无法处理高并发');
    console.log('   🟡 应用层瓶颈: 单线程处理请求');
  }
  
  console.log('\n💡 针对200+用户的优化建议:');
  console.log('   🚀 立即优化 (必须):');
  console.log('      1. 升级到 PostgreSQL/MySQL 数据库');
  console.log('      2. 实现数据库连接池 (20-50个连接)');
  console.log('      3. 添加 Redis 缓存层');
  console.log('      4. 实现请求限流 (每IP 100请求/分钟)');
  
  console.log('   🔧 中期优化 (建议):');
  console.log('      5. 使用 PM2 集群模式 (4-8个进程)');
  console.log('      6. 实现 CDN 加速静态资源');
  console.log('      7. 数据库读写分离');
  console.log('      8. 添加负载均衡器');
  
  console.log('   🎯 长期优化 (可选):');
  console.log('      9. 微服务架构拆分');
  console.log('      10. 容器化部署 (Docker + Kubernetes)');
  console.log('      11. 监控和告警系统');
  console.log('      12. 自动扩缩容');
  
  // 服务器配置建议
  console.log('\n🖥️  服务器配置建议:');
  console.log('   📊 当前架构: 单机 + SQLite');
  console.log('   🎯 推荐配置:');
  console.log('      - CPU: 4核心以上');
  console.log('      - 内存: 8GB以上');
  console.log('      - 存储: SSD 100GB以上');
  console.log('      - 网络: 100Mbps以上');
  console.log('      - 数据库: PostgreSQL 或 MySQL');
}

// 运行测试
if (require.main === module) {
  runConcurrentTest().catch(console.error);
}

module.exports = { runConcurrentTest, calculateStats };
