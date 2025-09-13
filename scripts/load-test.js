const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 负载测试配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  concurrentUsers: 50, // 模拟50个并发用户
  requestsPerUser: 10, // 每个用户发送10个请求
  testDuration: 30000, // 测试持续30秒
};

// 测试场景
const TEST_SCENARIOS = [
  {
    name: 'Portal Page Access',
    path: '/portal',
    method: 'GET',
    weight: 40, // 40% 的请求
  },
  {
    name: 'Team Registration Form',
    path: '/team-register-new',
    method: 'GET',
    weight: 30, // 30% 的请求
  },
  {
    name: 'Enterprise Registration Form',
    path: '/enterprise-register',
    method: 'GET',
    weight: 20, // 20% 的请求
  },
  {
    name: 'Team Login Form',
    path: '/team-login',
    method: 'GET',
    weight: 10, // 10% 的请求
  },
];

// 统计信息
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
};

// 生成测试请求
function generateTestRequests() {
  const requests = [];
  
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    for (let j = 0; j < CONFIG.requestsPerUser; j++) {
      const scenario = selectScenario();
      requests.push({
        id: `${i}-${j}`,
        scenario,
        startTime: null,
        endTime: null,
      });
    }
  }
  
  return requests;
}

// 根据权重选择测试场景
function selectScenario() {
  const random = Math.random() * 100;
  let cumulativeWeight = 0;
  
  for (const scenario of TEST_SCENARIOS) {
    cumulativeWeight += scenario.weight;
    if (random <= cumulativeWeight) {
      return scenario;
    }
  }
  
  return TEST_SCENARIOS[0];
}

// 发送HTTP请求
function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    request.startTime = startTime;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: request.scenario.path,
      method: request.scenario.method,
      headers: {
        'User-Agent': 'LoadTest/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000, // 10秒超时
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        request.endTime = endTime;
        
        stats.totalRequests++;
        stats.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.successfulRequests++;
        } else {
          stats.failedRequests++;
          stats.errors.push({
            request: request.id,
            statusCode: res.statusCode,
            scenario: request.scenario.name,
            responseTime,
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
      
      stats.totalRequests++;
      stats.failedRequests++;
      stats.responseTimes.push(responseTime);
      stats.errors.push({
        request: request.id,
        error: error.message,
        scenario: request.scenario.name,
        responseTime,
      });
      
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      stats.totalRequests++;
      stats.failedRequests++;
      stats.responseTimes.push(responseTime);
      stats.errors.push({
        request: request.id,
        error: 'Request timeout',
        scenario: request.scenario.name,
        responseTime,
      });
      
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
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
    
    responseTime: {
      min: Math.min(...responseTimes) + 'ms',
      max: Math.max(...responseTimes) + 'ms',
      avg: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)] + 'ms',
      p90: responseTimes[Math.floor(responseTimes.length * 0.9)] + 'ms',
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)] + 'ms',
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)] + 'ms',
    },
    
    errors: stats.errors.slice(0, 10), // 只显示前10个错误
  };
}

// 主测试函数
async function runLoadTest() {
  console.log('🚀 开始负载测试...');
  console.log(`📊 测试配置: ${CONFIG.concurrentUsers} 并发用户, 每用户 ${CONFIG.requestsPerUser} 请求`);
  console.log(`⏱️  测试场景: ${TEST_SCENARIOS.map(s => s.name).join(', ')}`);
  console.log('─'.repeat(60));
  
  const requests = generateTestRequests();
  console.log(`📝 总共生成 ${requests.length} 个测试请求`);
  
  // 分批发送请求，避免瞬间过载
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  
  console.log(`📦 分为 ${batches.length} 个批次，每批次 ${batchSize} 个请求`);
  
  // 执行测试
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 执行批次 ${i + 1}/${batches.length} (${batch.length} 请求)`);
    
    const promises = batch.map(request => 
      sendRequest(request).catch(error => {
        console.error(`❌ 请求失败: ${request.id} - ${error.message}`);
        return null;
      })
    );
    
    await Promise.all(promises);
    
    // 批次间延迟
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📈 负载测试结果');
  console.log('='.repeat(60));
  
  const results = calculateStats();
  
  console.log(`📊 总请求数: ${results.totalRequests}`);
  console.log(`✅ 成功请求: ${results.successfulRequests}`);
  console.log(`❌ 失败请求: ${results.failedRequests}`);
  console.log(`📈 成功率: ${results.successRate}`);
  console.log(`⏱️  总耗时: ${results.totalTime}`);
  console.log(`🚀 请求/秒: ${results.requestsPerSecond}`);
  
  console.log('\n📊 响应时间统计:');
  console.log(`   最小: ${results.responseTime.min}`);
  console.log(`   最大: ${results.responseTime.max}`);
  console.log(`   平均: ${results.responseTime.avg}`);
  console.log(`   P50:  ${results.responseTime.p50}`);
  console.log(`   P90:  ${results.responseTime.p90}`);
  console.log(`   P95:  ${results.responseTime.p95}`);
  console.log(`   P99:  ${results.responseTime.p99}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ 错误详情 (前10个):');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.scenario}: ${error.error || error.statusCode} (${error.responseTime}ms)`);
    });
  }
  
  // 性能评估
  console.log('\n🎯 性能评估:');
  const avgResponseTime = parseFloat(results.responseTime.avg);
  const successRate = parseFloat(results.successRate);
  
  if (avgResponseTime < 500 && successRate > 95) {
    console.log('🟢 优秀: 响应时间快，成功率高');
  } else if (avgResponseTime < 1000 && successRate > 90) {
    console.log('🟡 良好: 性能可接受');
  } else if (avgResponseTime < 2000 && successRate > 80) {
    console.log('🟠 一般: 需要优化');
  } else {
    console.log('🔴 较差: 需要重大优化');
  }
  
  // 瓶颈分析
  console.log('\n🔍 瓶颈分析:');
  if (avgResponseTime > 1000) {
    console.log('⚠️  响应时间较慢，可能瓶颈:');
    console.log('   - 数据库查询慢 (SQLite 并发限制)');
    console.log('   - 文件 I/O 操作');
    console.log('   - 加密/解密操作');
  }
  
  if (successRate < 90) {
    console.log('⚠️  成功率较低，可能问题:');
    console.log('   - 数据库连接池不足');
    console.log('   - 内存不足');
    console.log('   - 服务器资源限制');
  }
  
  console.log('\n💡 优化建议:');
  console.log('   1. 升级到 PostgreSQL/MySQL 数据库');
  console.log('   2. 实现数据库连接池');
  console.log('   3. 添加 Redis 缓存');
  console.log('   4. 使用 CDN 加速静态资源');
  console.log('   5. 实现请求限流和熔断机制');
}

// 运行测试
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, calculateStats };
