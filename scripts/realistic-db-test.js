const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 基于实际数据库结构的性能测试
class RealisticDatabaseTest {
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

  // 测试实际业务场景的查询
  async testBusinessQueries() {
    console.log('🔍 测试实际业务查询...');
    
    const queries = [
      {
        name: '查询所有团队',
        method: 'all',
        sql: 'SELECT team_name, project_name, status, is_enterprise FROM teams LIMIT 50',
      },
      {
        name: '查询专家列表',
        method: 'all',
        sql: 'SELECT username, role, expert_type FROM users WHERE role = "expert" LIMIT 20',
      },
      {
        name: '查询评审分配情况',
        method: 'all',
        sql: 'SELECT ra.id, t.team_name, u.username as expert_name, ra.assignment_status, ra.score FROM review_assignments ra JOIN teams t ON ra.file_id = t.id JOIN users u ON ra.expert_id = u.id LIMIT 30',
      },
      {
        name: '查询团队核心成员',
        method: 'all',
        sql: 'SELECT t.team_name, cm.name, cm.position, cm.organization FROM teams t JOIN core_members cm ON t.id = cm.team_id LIMIT 50',
      },
      {
        name: '统计团队数量',
        method: 'get',
        sql: 'SELECT COUNT(*) as total_teams, SUM(CASE WHEN is_enterprise = 1 THEN 1 ELSE 0 END) as enterprise_teams, SUM(CASE WHEN is_enterprise = 0 THEN 1 ELSE 0 END) as team_teams FROM teams',
      },
    ];

    for (const query of queries) {
      try {
        const result = await this.executeOperation(query);
        console.log(`  ✅ ${query.name}: 成功 (${Array.isArray(result) ? result.length : 1} 条记录)`);
      } catch (error) {
        console.log(`  ❌ ${query.name}: ${error.message}`);
      }
    }
  }

  // 测试写入操作
  async testWriteOperations() {
    console.log('✍️  测试写入操作...');
    
    const writeOperations = [
      {
        name: '插入测试团队',
        method: 'run',
        sql: 'INSERT INTO teams (team_name, password, contact_email, project_name, status, is_enterprise) VALUES (?, ?, ?, ?, ?, ?)',
        params: ['test_team_' + Date.now(), 'hashed_password', 'test@example.com', 'Test Project', 'pending', 0],
      },
      {
        name: '更新团队状态',
        method: 'run',
        sql: 'UPDATE teams SET status = ? WHERE team_name LIKE ?',
        params: ['completed', 'test_team_%'],
      },
      {
        name: '插入测试专家',
        method: 'run',
        sql: 'INSERT INTO users (username, password, role, expert_type) VALUES (?, ?, ?, ?)',
        params: ['test_expert_' + Date.now(), 'hashed_password', 'expert', 'team'],
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

  // 测试高并发查询
  async testConcurrentQueries() {
    console.log('🚀 测试并发查询...');
    
    const concurrentOperations = 100;
    const promises = [];
    
    for (let i = 0; i < concurrentOperations; i++) {
      const operation = {
        name: `并发查询_${i}`,
        method: 'all',
        sql: 'SELECT team_name, status FROM teams LIMIT 10',
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

  // 测试复杂查询
  async testComplexQueries() {
    console.log('🧮 测试复杂查询...');
    
    const complexQueries = [
      {
        name: '团队评审统计',
        method: 'all',
        sql: `
          SELECT 
            t.team_name,
            t.project_name,
            COUNT(ra.id) as review_count,
            AVG(ra.score) as avg_score,
            MAX(ra.score) as max_score,
            MIN(ra.score) as min_score
          FROM teams t
          LEFT JOIN review_assignments ra ON t.id = ra.file_id
          GROUP BY t.id, t.team_name, t.project_name
          HAVING review_count > 0
          LIMIT 20
        `,
      },
      {
        name: '专家工作量统计',
        method: 'all',
        sql: `
          SELECT 
            u.username,
            u.expert_type,
            COUNT(ra.id) as assigned_reviews,
            COUNT(CASE WHEN ra.assignment_status = 'completed' THEN 1 END) as completed_reviews,
            AVG(ra.score) as avg_score
          FROM users u
          LEFT JOIN review_assignments ra ON u.id = ra.expert_id
          WHERE u.role = 'expert'
          GROUP BY u.id, u.username, u.expert_type
          ORDER BY assigned_reviews DESC
          LIMIT 10
        `,
      },
    ];

    for (const query of complexQueries) {
      try {
        const result = await this.executeOperation(query);
        console.log(`  ✅ ${query.name}: 成功 (${result.length} 条记录)`);
      } catch (error) {
        console.log(`  ❌ ${query.name}: ${error.message}`);
      }
    }
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
    console.log('🎯 实际业务场景数据库性能测试');
    console.log('─'.repeat(60));
    
    try {
      await this.connect();
      
      // 1. 业务查询测试
      await this.testBusinessQueries();
      console.log('');
      
      // 2. 写入操作测试
      await this.testWriteOperations();
      console.log('');
      
      // 3. 并发查询测试
      await this.testConcurrentQueries();
      console.log('');
      
      // 4. 复杂查询测试
      await this.testComplexQueries();
      console.log('');
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      await this.close();
    }
    
    // 输出结果
    console.log('='.repeat(60));
    console.log('📈 实际业务场景数据库性能测试结果');
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
      console.log('🟢 优秀: 数据库性能良好，可以处理高并发');
    } else if (avgResponseTime < 50 && successRate > 90 && opsPerSecond > 50) {
      console.log('🟡 良好: 数据库性能可接受，适合中等并发');
    } else if (avgResponseTime < 100 && successRate > 80 && opsPerSecond > 20) {
      console.log('🟠 一般: 数据库需要优化，高并发时可能有问题');
    } else {
      console.log('🔴 较差: 数据库性能严重不足，无法处理高并发');
    }
    
    // 针对200+用户的评估
    console.log('\n🎯 针对200+用户的数据库评估:');
    
    if (avgResponseTime > 100) {
      console.log('⚠️  响应时间慢，主要问题:');
      console.log('   🔴 SQLite 单线程写入限制');
      console.log('   🔴 复杂查询性能差');
      console.log('   🟡 缺少数据库索引');
      console.log('   🟡 文件 I/O 瓶颈');
    }
    
    if (opsPerSecond < 50) {
      console.log('⚠️  吞吐量低，主要问题:');
      console.log('   🔴 SQLite 并发限制');
      console.log('   🔴 数据库锁竞争');
      console.log('   🟡 查询优化不足');
    }
    
    console.log('\n💡 针对200+用户的优化建议:');
    console.log('   🚀 立即优化 (必须):');
    console.log('      1. 升级到 PostgreSQL 或 MySQL');
    console.log('      2. 实现数据库连接池 (20-50个连接)');
    console.log('      3. 添加关键字段索引');
    console.log('      4. 优化复杂查询语句');
    
    console.log('   🔧 中期优化 (建议):');
    console.log('      5. 实现 Redis 缓存层');
    console.log('      6. 数据库读写分离');
    console.log('      7. 分页查询优化');
    console.log('      8. 定期数据库维护');
    
    console.log('\n📊 成本效益分析:');
    console.log('   💰 当前: SQLite (免费，但性能有限)');
    console.log('   💰 推荐: 阿里云 RDS PostgreSQL (¥200-500/月)');
    console.log('   📈 收益: 支持1000+并发，响应时间 < 50ms');
    console.log('   ⏱️  迁移: 1-2天工作量');
  }
}

// 运行测试
if (require.main === module) {
  const test = new RealisticDatabaseTest();
  test.runAllTests().catch(console.error);
}

module.exports = RealisticDatabaseTest;
