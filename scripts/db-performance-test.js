const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库性能测试
class DatabasePerformanceTest {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/expert_review.db');
    this.db = null;
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      responseTimes: [],
      errors: [],
      startTime: Date.now(),
    };
  }

  // 连接数据库
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ 数据库连接成功');
          resolve();
        }
      });
    });
  }

  // 关闭数据库连接
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err);
          } else {
            console.log('✅ 数据库连接已关闭');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // 执行数据库操作
  async executeOperation(operation, params = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.db[operation.method](operation.sql, params, (err, result) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.stats.totalOperations++;
        this.stats.responseTimes.push(responseTime);
        
        if (err) {
          this.stats.failedOperations++;
          this.stats.errors.push({
            operation: operation.name,
            error: err.message,
            responseTime,
            timestamp: new Date().toISOString(),
          });
          reject(err);
        } else {
          this.stats.successfulOperations++;
          resolve(result);
        }
      });
    });
  }

  // 测试查询性能
  async testQueryPerformance() {
    console.log('🔍 测试查询性能...');
    
    const queries = [
      {
        name: '查询所有用户',
        method: 'all',
        sql: 'SELECT * FROM users LIMIT 100',
      },
      {
        name: '查询所有团队',
        method: 'all',
        sql: 'SELECT * FROM teams LIMIT 100',
      },
      {
        name: '查询评审分配',
        method: 'all',
        sql: 'SELECT * FROM review_assignments LIMIT 100',
      },
      {
        name: '复杂关联查询',
        method: 'all',
        sql: `
          SELECT t.team_name, t.project_name, u.username as expert_name, ra.score
          FROM teams t
          LEFT JOIN review_assignments ra ON t.id = ra.team_id
          LEFT JOIN users u ON ra.expert_id = u.id
          LIMIT 50
        `,
      },
    ];

    for (const query of queries) {
      try {
        await this.executeOperation(query);
        console.log(`  ✅ ${query.name}: 成功`);
      } catch (error) {
        console.log(`  ❌ ${query.name}: ${error.message}`);
      }
    }
  }

  // 测试写入性能
  async testWritePerformance() {
    console.log('✍️  测试写入性能...');
    
    const writeOperations = [
      {
        name: '插入用户',
        method: 'run',
        sql: 'INSERT INTO users (username, email, password_hash, role, expert_type) VALUES (?, ?, ?, ?, ?)',
        params: ['test_user', 'test@example.com', 'hashed_password', 'expert', 'team'],
      },
      {
        name: '插入团队',
        method: 'run',
        sql: 'INSERT INTO teams (team_name, project_name, is_enterprise, status) VALUES (?, ?, ?, ?)',
        params: ['test_team', 'test_project', 0, 'pending'],
      },
      {
        name: '更新团队状态',
        method: 'run',
        sql: 'UPDATE teams SET status = ? WHERE team_name = ?',
        params: ['completed', 'test_team'],
      },
    ];

    for (const operation of writeOperations) {
      try {
        await this.executeOperation(operation, operation.params);
        console.log(`  ✅ ${operation.name}: 成功`);
      } catch (error) {
        console.log(`  ❌ ${operation.name}: ${error.message}`);
      }
    }
  }

  // 测试并发性能
  async testConcurrentPerformance() {
    console.log('🚀 测试并发性能...');
    
    const concurrentOperations = 50;
    const promises = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      const operation = {
        name: `并发查询_${i}`,
        method: 'all',
        sql: 'SELECT * FROM users LIMIT 10',
      };
      
      promises.push(
        this.executeOperation(operation).catch(error => {
          console.log(`  ❌ 并发操作 ${i}: ${error.message}`);
        })
      );
    }
    
    try {
      await Promise.all(promises);
      console.log(`  ✅ 并发测试完成: ${concurrentOperations} 个操作`);
    } catch (error) {
      console.log(`  ❌ 并发测试失败: ${error.message}`);
    }
  }

  // 测试事务性能
  async testTransactionPerformance() {
    console.log('🔄 测试事务性能...');
    
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // 执行多个操作
        this.db.run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
          ['tx_user1', 'tx1@example.com', 'hash1', 'expert']);
        
        this.db.run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
          ['tx_user2', 'tx2@example.com', 'hash2', 'expert']);
        
        this.db.run('INSERT INTO teams (team_name, project_name, is_enterprise, status) VALUES (?, ?, ?, ?)', 
          ['tx_team', 'tx_project', 0, 'pending']);
        
        this.db.run('COMMIT', (err) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          this.stats.totalOperations++;
          this.stats.responseTimes.push(responseTime);
          
          if (err) {
            this.stats.failedOperations++;
            this.stats.errors.push({
              operation: '事务测试',
              error: err.message,
              responseTime,
              timestamp: new Date().toISOString(),
            });
            console.log(`  ❌ 事务测试: ${err.message}`);
            reject(err);
          } else {
            this.stats.successfulOperations++;
            console.log(`  ✅ 事务测试: 成功 (${responseTime}ms)`);
            resolve();
          }
        });
      });
    });
  }

  // 计算统计信息
  calculateStats() {
    const responseTimes = this.stats.responseTimes.sort((a, b) => a - b);
    const totalTime = Date.now() - this.stats.startTime;
    
    return {
      totalOperations: this.stats.totalOperations,
      successfulOperations: this.stats.successfulOperations,
      failedOperations: this.stats.failedOperations,
      successRate: (this.stats.successfulOperations / this.stats.totalOperations * 100).toFixed(2) + '%',
      totalTime: totalTime + 'ms',
      operationsPerSecond: (this.stats.totalOperations / (totalTime / 1000)).toFixed(2),
      
      responseTime: {
        min: Math.min(...responseTimes) + 'ms',
        max: Math.max(...responseTimes) + 'ms',
        avg: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
        p50: responseTimes[Math.floor(responseTimes.length * 0.5)] + 'ms',
        p90: responseTimes[Math.floor(responseTimes.length * 0.9)] + 'ms',
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)] + 'ms',
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)] + 'ms',
      },
      
      errors: this.stats.errors.slice(0, 10),
    };
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🎯 数据库性能测试开始');
    console.log('─'.repeat(60));
    
    try {
      await this.connect();
      
      // 1. 查询性能测试
      await this.testQueryPerformance();
      console.log('');
      
      // 2. 写入性能测试
      await this.testWritePerformance();
      console.log('');
      
      // 3. 并发性能测试
      await this.testConcurrentPerformance();
      console.log('');
      
      // 4. 事务性能测试
      await this.testTransactionPerformance();
      console.log('');
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      await this.close();
    }
    
    // 输出结果
    console.log('='.repeat(60));
    console.log('📈 数据库性能测试结果');
    console.log('='.repeat(60));
    
    const results = this.calculateStats();
    
    console.log(`📊 总操作数: ${results.totalOperations}`);
    console.log(`✅ 成功操作: ${results.successfulOperations}`);
    console.log(`❌ 失败操作: ${results.failedOperations}`);
    console.log(`📈 成功率: ${results.successRate}`);
    console.log(`⏱️  总耗时: ${results.totalTime}`);
    console.log(`🚀 操作/秒: ${results.operationsPerSecond}`);
    
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
        console.log(`   ${index + 1}. ${error.operation}: ${error.error} (${error.responseTime}ms)`);
      });
    }
    
    // 性能评估
    console.log('\n🎯 数据库性能评估:');
    const avgResponseTime = parseFloat(results.responseTime.avg);
    const successRate = parseFloat(results.successRate);
    const opsPerSecond = parseFloat(results.operationsPerSecond);
    
    if (avgResponseTime < 10 && successRate > 95 && opsPerSecond > 100) {
      console.log('🟢 优秀: 数据库性能良好');
    } else if (avgResponseTime < 50 && successRate > 90 && opsPerSecond > 50) {
      console.log('🟡 良好: 数据库性能可接受');
    } else if (avgResponseTime < 100 && successRate > 80 && opsPerSecond > 20) {
      console.log('🟠 一般: 数据库需要优化');
    } else {
      console.log('🔴 较差: 数据库性能严重不足');
    }
    
    // SQLite 特定问题分析
    console.log('\n🔍 SQLite 瓶颈分析:');
    
    if (avgResponseTime > 50) {
      console.log('⚠️  SQLite 性能问题:');
      console.log('   🔴 单线程写入: 无法并发写入');
      console.log('   🔴 文件锁: 高并发时锁等待');
      console.log('   🟡 索引不足: 查询慢');
      console.log('   🟡 内存限制: 缓存不足');
    }
    
    if (successRate < 90) {
      console.log('⚠️  SQLite 稳定性问题:');
      console.log('   🔴 文件锁冲突: 并发写入失败');
      console.log('   🔴 磁盘 I/O: 频繁读写');
      console.log('   🟡 内存泄漏: 长时间运行');
    }
    
    console.log('\n💡 SQLite 优化建议:');
    console.log('   🚀 立即优化:');
    console.log('      1. 添加数据库索引');
    console.log('      2. 使用 WAL 模式');
    console.log('      3. 调整缓存大小');
    console.log('      4. 实现连接池');
    
    console.log('   🔧 中期优化:');
    console.log('      5. 升级到 PostgreSQL');
    console.log('      6. 实现读写分离');
    console.log('      7. 添加 Redis 缓存');
    console.log('      8. 数据库分片');
    
    console.log('\n🎯 针对200+用户的数据库建议:');
    console.log('   📊 当前: SQLite (单文件数据库)');
    console.log('   🎯 推荐: PostgreSQL + Redis');
    console.log('   💰 成本: 阿里云 RDS PostgreSQL (¥200/月)');
    console.log('   🚀 性能: 支持1000+并发连接');
  }
}

// 运行测试
if (require.main === module) {
  const test = new DatabasePerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = DatabasePerformanceTest;
